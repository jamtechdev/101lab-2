// @ts-nocheck
import { useEffect, useState, useRef } from "react";
import { CountrySelectItems } from "@/components/common/CountrySelect";
import { decodeHtml } from "@/utils/decodeHtml";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Upload, FileText, X, ImagePlus, Video, ArrowLeft, Package, Sparkles, CheckCircle2, Search, Clock, Pencil, ArrowRight, Percent, MapPin } from "lucide-react";
import toast from 'react-hot-toast';
import logo from "@/assets/greenbidz_logo.png";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";
import { useGetCategoriesQuery, useVerifyUserQuery, useGetUserProfileQuery } from "@/rtk/slices/apiSlice";
import { useLanguageAwareCategories } from "@/hooks/useLanguageAwareCategories";
import { useGetUsersQuery } from "@/rtk/slices/adminApiSlice";
import { useAddProductMutation, useBatchCreateMutation, useUpdateBatchVisibilityMutation } from "@/rtk/slices/productSlice";
import axios from "axios";
import { useGetBatchByIdQuery } from "@/rtk/slices/batchApiSlice";
import { SITE_TYPE } from "@/config/site";
import { pushListingCreatedEvent } from "@/utils/gtm";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { batch } from "react-redux";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface UploadMethodProps {
  onNext?: (batchId: number) => void; // pass batch ID to next step
  onBatchCreated?: (batchId: number) => void; // called when new batch is created; keeps user on step 1 (no advance)
  showThankYouOnly?: boolean; // when true, show thank-you message instead of form (batch pending approval)
  pendingBatchId?: number | null; // batch ID when in thank-you view
  onEditListing?: () => void; // user wants to edit/update their listing (pending batch)
  showBackToStatus?: boolean; // when true, show "Back to listing status" on the form
  onBackToStatus?: () => void; // go back to thank-you / status view
  batchId?: number | null; // passed from parent so we don't rely on stale URL params
}

interface MediaFile {
  file: File;
  url: string;
  type: 'image' | 'video';
}

interface Location {
  id: string;
  address: string;
  country?: string;
}

interface InventoryItem {
  id: string;
  parentCategory: string;   // UI only — parent slug for subcategory filtering
  category: string;          // subcategory id (sent to API as product_category_ids)
  title: string;
  description: string;
  condition: string[];
  operationStatus: string[];
  locations: Location[];
  estimatedValue: string;
  currency: "TWD" | "USD";
  media: MediaFile[];
  mainImage?: File;
  documentFile?: File[];
  sellerId?: string;
  sellerName: string;
  sellerCompany?: string;
  quantity: number;
  category_name: string;
  selectedMediaIndex: any;
  sellerVisible: any;
  allowedSites: string[];

  // ===== PRICE SYSTEM =====
  enableBuyNow: boolean;
  priceFormat: "buyNow" | "offer";
  pricePerUnit: string;
  priceCurrency: "USD" | "TWD";

  // ===== Sustainability =====
  replacementCostPerUnit: string;
  weightPerUnit: string;
}


const allowedFileTypes = [
  "pdf",
  "xls", "xlsx",
  "csv",
  "doc", "docx",
  "txt",
  "ppt", "pptx"
];


const parsePhpArray = (meta) => {
  if (!meta) return [];

  try {
    // match all string values inside quotes
    const matches = [...meta.matchAll(/"([^"]+)"/g)];
    return matches.map(m => m[1]);
  } catch (e) {
    return [];
  }
};

// Valid condition keys used in the form (must match i18n upload.conditionOptions.*)
const VALID_CONDITION_KEYS = [
  "new",
  "usedFunctional",
  "forParts",
  "wasteDisposal",
  "demolitionRemoval",
] as const;

/**
 * Normalize condition so we never store character-split or invalid values.
 * Backend sometimes returns condition as "U","s","e","d" (parsePhpArray -> ["U","s","e","d"]).
 * AI may return a string like "used". Always return an array of valid keys.
 */
function normalizeCondition(
  value: string | string[] | undefined | null
): string[] {
  if (value == null) return [];
  const arr = Array.isArray(value) ? value : [value];
  const joined = arr.join("").toLowerCase();
  // Character-split "used" or "Used" from backend
  if (
    (joined === "used" || joined === "usedfunctional") &&
    (arr.length > 1 || arr[0]?.toLowerCase() === "used")
  ) {
    return ["usedFunctional"];
  }
  if (joined === "new") return ["new"];
  if (joined === "forparts") return ["forParts"];
  if (joined === "wastedisposal") return ["wasteDisposal"];
  if (joined === "demolitionremoval") return ["demolitionRemoval"];
  // Filter to only valid keys; drop unknown/character junk
  return arr.filter((c) =>
    VALID_CONDITION_KEYS.includes(c as (typeof VALID_CONDITION_KEYS)[number])
  );
}

type NetworkSeller = {
  buyer_id: number;
  company_name?: string;
  email?: string;
};


const UploadMethod: React.FC<UploadMethodProps> = ({ onNext, onBatchCreated, showThankYouOnly, pendingBatchId, onEditListing, showBackToStatus, onBackToStatus, batchId: propBatchId }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const batchIdParam = searchParams.get("batchId");
  const urlFinalStep = searchParams.get("finalStep");
  const sellerName = localStorage.getItem("userName")

  // Prefer prop (reliable, from parent state) over URL param (can be stale after replaceState navigation)
  const parsedBatchId = propBatchId ?? (batchIdParam ? Number(batchIdParam) : undefined);

  const [batchId, setBatchId] = useState(parsedBatchId);

  // Sync batchId state when parent prop changes (e.g. going back to step 1 after creating a batch)
  useEffect(() => {
    if (propBatchId != null && propBatchId !== batchId) {
      setBatchId(propBatchId);
    }
  }, [propBatchId]);

  const { data: batchData, refetch } = useGetBatchByIdQuery(batchId, {
    skip: !batchId,
  })

  // const { data: batchData, refetch } = useGetBatchByIdQuery(batchId, {
  //   skip: batchId == null,
  // });

  const [items, setItems] = useState<InventoryItem[]>([
    {
      id: "1",
      parentCategory: "",
      category: "",
      title: "",
      description: "",
      condition: [],
      operationStatus: [],
      locations: [{ id: "1", address: "" }],
      estimatedValue: "",
      currency: "TWD",
      media: [],
      sellerName: "",
      quantity: 1,
      category_name: "",
      selectedMediaIndex: 0,
      sellerVisible: true,
      allowedSites: [],

      // PRICE DEFAULTS
      enableBuyNow: false,
      priceFormat: "offer",
      pricePerUnit: "",
      priceCurrency: "USD",

      replacementCostPerUnit: "",
      weightPerUnit: "",
    },
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [multipleLocations, setMultipleLocations] = useState<{ [key: string]: boolean }>({});
  const [addProduct] = useAddProductMutation();
  const [batchCreate] = useBatchCreateMutation();
  const [updateBatchVisibility] = useUpdateBatchVisibilityMutation();

  const ALLOWED_SITES_OPTIONS = [
    { value: "101lab.co" },
    { value: "greenbidz.com" },
  ];


  const lang = localStorage.getItem("language") || "en";

  const { data } = useLanguageAwareCategories();
  const { data: userData, } = useVerifyUserQuery();

  const [loading, setLoading] = useState(false);
  const [showBatchCreatedDialog, setShowBatchCreatedDialog] = useState(false);
  const [createdBatchId, setCreatedBatchId] = useState<number | null>(null);

  // Field-level validation errors per item (used to highlight invalid inputs)
  const [itemErrors, setItemErrors] = useState<
    Record<string, { [field: string]: boolean }>
  >({});

  const userId = localStorage.getItem("userId");

  const { data: profileData } = useGetUserProfileQuery(userId ?? "");
  const savedAddress = (() => {
    const addr = profileData?.data?.personalInfo?.address;
    if (!addr) return "";
    return [addr.street, addr.district, addr.city, addr.postalCode, addr.country]
      .filter(Boolean)
      .join(", ");
  })();
  const savedCountry = profileData?.data?.personalInfo?.address?.country || "";

  // Auto-fill address and country for all items when profile loads
  useEffect(() => {
    if (!savedAddress && !savedCountry) return;
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        locations: item.locations.map((loc) => ({
          ...loc,
          address: loc.address ? loc.address : savedAddress,
          country: loc.country ? loc.country : savedCountry,
        })),
      }))
    );
  }, [savedAddress, savedCountry]);

  const [aiPreview, setAiPreview] = useState<{
    ai: any;
    files: { file: File; url: string; type: string }[];
  } | null>(null);

  const [currentAiItemId, setCurrentAiItemId] = useState<string | null>(null);

  // Batch visibility settings
  const [batchVisibility, setBatchVisibility] = useState<'PUBLIC' | 'PRIVATE' | 'NETWORK'>('PUBLIC');
  const [networkSellers, setNetworkSellers] = useState<NetworkSeller[]>([]);
  const [sellerSearch, setSellerSearch] = useState('');
  const [showSellerDropdown, setShowSellerDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Network seller functions
  const addNetworkSeller = (seller: NetworkSeller) => {
    if (networkSellers.some(s => s.buyer_id === seller.buyer_id)) {
      toast.error("User already added");
      return;
    }
    setNetworkSellers(prev => [...prev, seller]);
    toast.success(t("batch.userAdded", "User added to network"));
  };

  const removeNetworkSeller = (sellerId: number) => {
    setNetworkSellers(prev =>
      prev.filter(s => s.buyer_id !== sellerId)
    );
    toast.success(t("batch.userRemoved", "User removed from network"));
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSellerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch all users for network visibility selection
  const { data: networkUsersData, isLoading: networkUsersLoading } = useGetUsersQuery(
    {
      search: sellerSearch,
      limit: 50
    },
    {
      skip: batchVisibility !== 'NETWORK'
    }
  );

  const addRow = () => {
    const newId = Date.now().toString();
    setItems([
      ...items,
      {
        id: newId,
        parentCategory: "",
        category: "",
        title: "",
        description: "",
        condition: [],
        operationStatus: [],
        locations: [{ id: "1", address: "" }],
        estimatedValue: "",
        currency: "TWD",
        media: [],
        sellerName: "",
        quantity: 1,
        category_name: "",
        selectedMediaIndex: 0,
        sellerVisible: true,
        allowedSites: [],

        // PRICE DEFAULTS
        enableBuyNow: false,
        priceFormat: "offer",
        pricePerUnit: "",
        priceCurrency: "USD",

        replacementCostPerUnit: "",
        weightPerUnit: "",
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  // const updateItem = (id: string, field: keyof InventoryItem, value: string | MediaFile[]) => {
  //   setItems(
  //     items.map((item) =>
  //       item.id === id ? { ...item, [field]: value } : item
  //     )
  //   );
  // };



  const updateItem = <K extends keyof InventoryItem>(
    id: string,
    field: K,
    value: InventoryItem[K]
  ) => {
    setItems(items =>
      items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const addLocation = (itemId: string) => {
    setItems(
      items.map((item) =>
        item.id === itemId
          ? {
            ...item,
            locations: [
              ...item.locations,
              { id: Date.now().toString(), address: "" },
            ],
          }
          : item
      )
    );
  };

  const removeLocation = (itemId: string, locationId: string) => {
    setItems(
      items.map((item) =>
        item.id === itemId
          ? {
            ...item,
            locations: item.locations.filter((loc) => loc.id !== locationId),
          }
          : item
      )
    );
  };

  const updateLocation = (
    itemId: string,
    locationId: string,
    field: keyof Location,
    value: string
  ) => {
    setItems(
      items.map((item) =>
        item.id === itemId
          ? {
            ...item,
            locations: item.locations.map((loc) =>
              loc.id === locationId ? { ...loc, [field]: value } : loc
            ),
          }
          : item
      )
    );
  };

  const handleFileUpload = (itemId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (!files.length) return;

    // Validate file types
    const invalidFiles = files.filter(file => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      return !allowedFileTypes.includes(ext || "");
    });

    if (invalidFiles.length > 0) {
      toast.error(t("uploadMethod.invalidFileType") + ": " + invalidFiles.map(f => f.name).join(", "));
      return;
    }

    const currentItem = items.find(i => i.id === itemId);
    const currentDocCount = currentItem?.documentFile?.length || 0;
    const validFiles = files.slice(0, Math.max(0, 5 - currentDocCount));
    if (validFiles.length < files.length) {
      toast.error(t("upload.maxDocumentsAllowed"));
    }
    if (validFiles.length === 0) return;

    setItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? {
            ...item,
            documentFile: [...(item.documentFile || []), ...validFiles],
          }
          : item
      )
    );

    toast.success(
      t("uploadMethod.fileUploadSuccess")
    );
  };


  const removeUploadedFile = () => {
    setUploadedFile(null);
    toast.success(t('uploadMethod.fileRemoved'));
  };

  const handleMediaUpload = (itemId: string, event: React.ChangeEvent<HTMLInputElement>) => {

    const files = event.target.files;
    if (!files) return;

    const newMedia: MediaFile[] = [];

    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) {
        toast.error(t('upload.fileNotValid', { fileName: file.name }));
        continue;
      }

      const item = items.find(i => i.id === itemId);
      if (!item) continue;

      // Check max 10 photos + 2 videos
      if (isVideo && item.media.filter(m => m.type === "video").length >= 2) {
        toast.error(t('upload.onlyOneVideoAllowed'));
        continue;
      }
      if (isImage && item.media.filter(m => m.type === "image").length >= 10) {
        toast.error(t('upload.maxPhotosAllowed'));
        continue;
      }

      const url = URL.createObjectURL(file); // quick preview
      newMedia.push({ file, url, type: isVideo ? "video" : "image" });
    }

    // Merge new media with existing media
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, media: [...item.media, ...newMedia] } : item
      )
    );

    if (newMedia.length > 0) {
      const imageCount = newMedia.filter(m => m.type === "image").length;
      const videoCount = newMedia.filter(m => m.type === "video").length;
      let message = '';
      if (imageCount && videoCount) {
        message = t('upload.photosAndVideosAdded', { photoCount: imageCount, videoCount });
      } else if (imageCount) {
        message = t('upload.photosAdded', { count: imageCount });
      } else if (videoCount) {
        message = t('upload.videosAdded', { count: videoCount });
      }
      toast.success(message);
    }

    event.target.value = "";


  };

  const getMissingFields = (item: InventoryItem) => {
    const missing: string[] = [];

    // Title
    if (!item.title?.trim()) {
      missing.push(t("uploadMethod.title"));
    }

    // Quantity (must be a positive number)
    if (!item.quantity || Number(item.quantity) <= 0) {
      missing.push(t("uploadMethod.quantity"));
    }

    // Category
    if (!item.category) {
      missing.push(t("uploadMethod.category"));
    }
    // If "other" is selected, custom category name is required
    if (item.category === "other" && !item.category_name?.trim()) {
      missing.push(t("uploadMethod.customCategory"));
    }

    // Condition (multi-select, stored as string[])
    const normalizedCondition = normalizeCondition(item.condition);
    if (!Array.isArray(normalizedCondition) || normalizedCondition.length === 0) {
      missing.push(t("uploadMethod.condition"));
    }

    // Operation status (multi-select, stored as string[])
    if (!Array.isArray(item.operationStatus) || item.operationStatus.length === 0) {
      missing.push(t("uploadMethod.operationStatus"));
    }

    // Description
    if (!item.description?.trim()) {
      missing.push(t("uploadMethod.description"));
    }

    // At least one location with non-empty address
    const hasValidLocation = Array.isArray(item.locations)
      && item.locations.some((loc) => loc.address && loc.address.trim().length > 0);
    if (!hasValidLocation) {
      missing.push(t("uploadMethod.address"));
    }

    // if (!item.allowedSites?.length)
    //   missing.push("Allowed Sites");

    return missing;
  };



  const removeMedia = (itemId: string, mediaIndex: number) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id !== itemId) return item;

        // Remove the selected media
        const updatedMedia = item.media.filter((_, index) => index !== mediaIndex);

        // Adjust selectedMediaIndex if needed
        let newSelectedIndex = item.selectedMediaIndex;
        if (mediaIndex === item.selectedMediaIndex) {
          newSelectedIndex = Math.max(0, item.selectedMediaIndex - 1);
        } else if (mediaIndex < item.selectedMediaIndex) {
          newSelectedIndex = item.selectedMediaIndex - 1;
        }

        return {
          ...item,
          media: updatedMedia,
          selectedMediaIndex: newSelectedIndex,
        };
      })
    );
  };



  const handleConfirm = async () => {
    const productIds: number[] = [];
    // let batchId: number | null = null;

    // Clear previous field errors
    setItemErrors({});

    const invalidItem = items.find((item) => {
      const missing = getMissingFields(item);
      return missing.length > 0;
    });

    if (invalidItem) {
      const errorsForItem: { [field: string]: boolean } = {};

      if (!invalidItem.title?.trim()) errorsForItem.title = true;
      if (!invalidItem.quantity || Number(invalidItem.quantity) <= 0)
        errorsForItem.quantity = true;
      if (!invalidItem.category) errorsForItem.category = true;
      if (
        invalidItem.category === "other" &&
        !invalidItem.category_name?.trim()
      )
        errorsForItem.category_name = true;

      const normalizedCondition = normalizeCondition(invalidItem.condition);
      if (!Array.isArray(normalizedCondition) || normalizedCondition.length === 0)
        errorsForItem.condition = true;

      if (
        !Array.isArray(invalidItem.operationStatus) ||
        invalidItem.operationStatus.length === 0
      )
        errorsForItem.operationStatus = true;

      if (!invalidItem.description?.trim()) errorsForItem.description = true;

      const hasValidLocation =
        Array.isArray(invalidItem.locations) &&
        invalidItem.locations.some(
          (loc) => loc.address && loc.address.trim().length > 0
        );
      if (!hasValidLocation) errorsForItem.address = true;

      setItemErrors((prev) => ({
        ...prev,
        [invalidItem.id]: errorsForItem,
      }));

      const missingFields = getMissingFields(invalidItem).join(", ");
      toast.error(`${t("uploadMethod.fillRequiredFields")}: ${missingFields}`);
      return;
    }

    try {
      setLoading(true);

      const baseURL = import.meta.env.VITE_PRODUCTION_URL;

      for (const item of items) {

        const formData = new FormData();

        // Mapped fields for backend WP API
        formData.append("product_title", item.title);
        formData.append("product_content", item.description || "");
        formData.append("product_type", "simple");
        formData.append("product_category_ids", item.category);
        formData.append("seller_name", item.sellerName || "seller-name");
        if (item.sellerCompany) formData.append("seller_company", item.sellerCompany);
        // formData.append("item_condition", item.condition);
        // formData.append("operation_status", item.operationStatus);

        (Array.isArray(item?.condition) ? item.condition : []).forEach((cond) =>
          formData.append("item_condition[]", cond)
        );

        (Array.isArray(item?.locations) ? item.locations : []).forEach((loc) =>
          formData.append("location[]", loc?.address)
        );
        formData.append("country", item.locations[0]?.country || "");

        (Array.isArray(item?.operationStatus) ? item.operationStatus : []).forEach((status) =>
          formData.append("operation_status[]", status)
        );


        formData.append("post_author_id", userId || "");
        formData.append("steps", "1");
        formData.append("quantity", item.quantity);
        formData.append("category_name", item.category_name)

        formData.append("sellerVisible", item.sellerVisible)

        formData.append(
          "replacement_cost_per_unit",
          item.replacementCostPerUnit
        );

        formData.append(
          "weight_per_unit",
          item.weightPerUnit
        );


        // ---------- Images ----------
        if (item.media?.length > 0) {
          item.media.forEach((media) => {
            if (media?.type === "video") {
              formData.append("videos", media.file)
            } else
              formData.append("images", media.file);
          });
        }

        // ---------- Documents ----------
        item.documentFile?.forEach((file) => {
          formData.append("documents", file);
        });

        if (batchData && item.id) {
          formData.append("product_id", item.id.toString());
        }


        formData.append(
          "price_now_enabled",
          item.enableBuyNow ? "1" : "0"
        );

        // ===== PRICE SYSTEM PAYLOAD =====
        formData.append("price_now_enabled", item.enableBuyNow ? "1" : "0");
        formData.append("price_format", item.priceFormat);
        formData.append("price_currency", item.priceCurrency);

        if (item.priceFormat === "buyNow") {
          formData.append("price_per_unit", item.pricePerUnit);
        } else {
          formData.append("price_per_unit", "");
        }

        (Array.isArray(item.allowedSites) ? item.allowedSites : []).forEach(site =>
          formData.append("allowed_sites[]", site)
        );

        // ---------- Call backend WP route ----------
        const response = await axios.post(
          `${baseURL}wp/create-product-direct?lang=${lang}&type=${SITE_TYPE}`,

          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            timeout: 120000, // optional: increase timeout for large files
          }
        );

        const result = response.data;


        if (!result?.success) {
          console.error("Failed to create product:", result);
          toast.error("Failed to create product");
          continue;
        }

        if (result?.data?.product_id) {
          productIds.push(result.data.product_id);
        }
      }

      // -------- Create Batch if products created --------

      if (!batchData) {

        if (productIds.length > 0) {
          const batchResult = await batchCreate({
            productIds,
            sellerId: userId,
            visibility: batchVisibility,
            networkSellers: batchVisibility === 'NETWORK' ? networkSellers.map(s => s.buyer_id) : [],
            type: SITE_TYPE,
            country: items[0]?.locations[0]?.country || "",
          }).unwrap();

          const newBatchId = batchResult?.data?.batch_id;
          setBatchId(newBatchId);
          setCreatedBatchId(newBatchId);
          setShowBatchCreatedDialog(true);
          if (onBatchCreated && newBatchId) {
            onBatchCreated(newBatchId);
          }

          // GA4 tracking — listing_created (fires once per batch after batchCreate success)
          try {
            const firstItem: any = items?.[0];
            if (newBatchId && firstItem) {
              const priceFormat = firstItem.priceFormat;
              const dealType: "bidding" | "make_offer" =
                priceFormat === "offer" ? "make_offer" : "bidding";
              const imagesCount = Array.isArray(firstItem.media)
                ? firstItem.media.filter((m: any) => m?.type !== "video").length
                : undefined;
              pushListingCreatedEvent({
                listing_id:             newBatchId,
                listing_title:          firstItem.title ?? "",
                listing_category:       firstItem.category_name || firstItem.category || "",
                asking_price:           Number(firstItem.pricePerUnit) || 0,
                deal_type:              dealType,
                is_first_listing:       batchResult?.data?.is_first_listing,
                sellers_listing_number: batchResult?.data?.sellers_listing_number,
                images_uploaded:        imagesCount,
                currency:               firstItem.priceCurrency,
              });
            }
          } catch { /* tracking errors must never affect UX */ }
          // Do not call onNext here — user stays on step 1 and sees "Thank you for listing" message
        }
      } else if (onNext && batchId) {
        onNext(batchId);
      }

      console.log("batch data is", batchId);

      if (batchData && batchId) {
        // Update batch visibility for existing batches
        try {
          await updateBatchVisibility({
            batchId: batchId,
            visibility: batchVisibility,
            networkSellers: batchVisibility === 'NETWORK' ? networkSellers.map(s => s.buyer_id) : [],
          }).unwrap();
          toast.success(t("batch.visibilityUpdated", "Batch visibility updated successfully"));
        } catch (visibilityError) {
          console.error("Failed to update batch visibility:", visibilityError);
          toast.error(t("batch.visibilityUpdateFailed", "Failed to update batch visibility"));
        }
        onNext(batchId);
      }
    } catch (error) {
      const serverMsg = error?.response?.data?.error?.message;
      // toast.error(t("upload.failedToUpload"));

      toast.error(serverMsg || t("upload.failedToUpload"));
    } finally {
      setLoading(false);
    }
  };


  const handleAIGenerate = async (itemId: string) => {
    try {
      const languages = lang === "zh" ? "zh-hant" : "en";

      // Find the item with the specific itemId
      const item = items.find(i => i.id === itemId);
      if (!item || !item.media || item.media.length === 0) {
        toast.error("No media files found for AI generation.");
        return;
      }

      const mediaFiles = item.media;

      const formData = new FormData();

      // Append media files to the FormData if they are instances of File
      mediaFiles.forEach(mediaItem => {
        if (mediaItem.file instanceof File) {
          formData.append("images", mediaItem.file);
        } else {
          console.warn("Skipping non-file media item:", mediaItem);
        }
      });

      // Append language parameter
      formData.append("language", languages);

      // Set loading for this specific item
      setItems(prev =>
        prev.map(i =>
          i.id === itemId ? { ...i, aiLoading: true } : i
        )
      );

      try {
        const baseURL = import.meta.env.VITE_PRODUCTION_URL;
        const response = await axios.post(
          `${baseURL}wp/analyze-process-images`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 120000,
          }
        );

        const result = response.data;

        if (!result?.success) {
          toast.error("AI generation failed. Please try again.");
          setItems(prev =>
            prev.map(i =>
              i.id === itemId ? { ...i, aiLoading: false } : i
            )
          );
          return;
        }

        // Set preview and current item ID for modal
        setAiPreview({
          ai: result.data,
          files: mediaFiles.filter(mediaItem => mediaItem instanceof File).map(file => ({
            file,
            url: URL.createObjectURL(file),
            type: "image",
          })),
        });
        setCurrentAiItemId(itemId);

        toast.success("AI analysis completed!");
      } catch (err) {
        console.error("AI API error:", err);
        toast.error("AI generation failed. Please try again.");
        setItems(prev =>
          prev.map(i =>
            i.id === itemId ? { ...i, aiLoading: false } : i
          )
        );
      } finally {
        // Stop loading for this specific item
        setItems(prev =>
          prev.map(i =>
            i.id === itemId ? { ...i, aiLoading: false } : i
          )
        );
      }
    } catch (err) {
      console.error("AI media handling error:", err);
    }
  };



  // Assuming batchData.products exists
  useEffect(() => {
    if (batchData?.data?.products?.length) {
      const mappedItems: InventoryItem[] = batchData?.data?.products.map(product => {
        const getMetaValue = (key: string) =>
          product.meta.find(m => m.meta_key === key)?.meta_value || "";


        // Parse documents from the direct documents field
        const documentFiles = (product.documents || []).flatMap(doc => {
          // The "id" field contains serialized URL(s), parse them
          const urls = parsePhpArray(doc.id);
          return urls.map(url => ({
            name: url.split("/").pop() || "document",
            url: url,
            type: doc.type || "application/octet-stream"
          }));
        });


        return {
          id: product.product_id.toString(),
          title: product.title,
          description: product.description,
          condition: normalizeCondition(parsePhpArray(getMetaValue("condition"))),
          operationStatus: parsePhpArray(getMetaValue("operation_status")),
          sellerName: getMetaValue("seller_name"),
          quantity: Number(getMetaValue("quantity") || 1),
          locations: parsePhpArray(getMetaValue("product_locations")).map((loc, idx) => {
            return {
              id: String(idx + 1),
              address: loc
            };
          }),
          estimatedValue: "",
          currency: "TWD",
          ...(() => {
            const productCat = product.categories?.[0];
            if (!productCat) return { parentCategory: "", category: "", category_name: "" };
            const labCats: any[] = Array.isArray(data) ? data : [];
            // Search subcategories first, then parent categories
            for (const parent of labCats) {
              for (const sub of (parent.subcategories ?? [])) {
                if (
                  sub.slug === productCat.term_slug ||
                  sub.id?.toString() === productCat.term_taxonomy_id?.toString() ||
                  sub.id?.toString() === productCat.term_id?.toString() ||
                  decodeHtml(sub.name).toLowerCase() === decodeHtml(productCat.term).toLowerCase()
                ) {
                  return {
                    parentCategory: parent.slug,
                    category: sub.id?.toString() ?? "",
                    category_name: decodeHtml(sub.name) || "",
                  };
                }
              }
              // Also check parent itself
              if (
                parent.slug === productCat.term_slug ||
                parent.id?.toString() === productCat.term_taxonomy_id?.toString() ||
                parent.id?.toString() === productCat.term_id?.toString() ||
                decodeHtml(parent.name).toLowerCase() === decodeHtml(productCat.term).toLowerCase()
              ) {
                return {
                  parentCategory: parent.slug,
                  category: parent.id?.toString() ?? "",
                  category_name: decodeHtml(parent.name) || "",
                };
              }
            }
            return {
              parentCategory: "",
              category: productCat.term_id?.toString() ?? "",
              category_name: decodeHtml(productCat.term) || "",
            };
          })(),
          media: product.attachments.map(att => ({
            file: null,
            url: att.url,
            type: att.type.startsWith("image") ? "image" : "video"
          })),
          documentFile: documentFiles,
          sellerVisible: getMetaValue("sellerVisible"),
          priceType: "fixed",
          selectedMediaIndex: 0,
          aiPreview: null,
          aiLoading: false,

          enableBuyNow: getMetaValue("price_now_enabled") === "1",
          buyNowPrice: getMetaValue("buy_now_price"),
          buyNowCurrency: (getMetaValue("buy_now_currency") || "USD") as "USD" | "TWD",
          allowedSites: parsePhpArray(getMetaValue("allowed_sites")),

          replacementCostPerUnit:
            getMetaValue("replacement_cost_per_unit"),

          weightPerUnit:
            getMetaValue("weight_per_unit"),


        };
      });

      setItems(mappedItems);

      setBatchVisibility(batchData?.data?.batch?.visibility)
    }

    // Note: Batch visibility cannot be loaded from current API structure
    // Visibility will be updated when saving changes
  }, [batchData]);



  useEffect(() => {
    if (batchId) {
      refetch();
    }
  }, [batchId, refetch]);


  // After step 1: when batch is pending, show thank-you message in a dedicated area (not step 2)
  if (showThankYouOnly) {
    return (
      <div className="min-h-screen bg-background">
        <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-12">
          <Card className="overflow-hidden border border-border/60 shadow-lg shadow-black/5 bg-card">
            <div className="bg-gradient-to-b from-primary/5 to-transparent border-b border-border/40 px-6 pt-8 pb-6">
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center ring-2 ring-primary/20">
                  <Clock className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
                    {t("productListing.approvalPending.title")}
                  </h2>
                  <p className="mt-2 text-muted-foreground leading-relaxed">
                    {t("productListing.approvalPending.message")}
                  </p>
                  <p className="mt-3 text-sm font-medium text-foreground">
                    {t("productListing.approvalPending.afterApprovalLockOpen")}
                  </p>
                </div>
              </div>
            </div>
            <CardContent className="px-6 py-6 space-y-5">
              {pendingBatchId && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-muted/60 text-foreground border border-border/60">
                  <span className="text-muted-foreground">{t("factories.tracking.batchId")}</span>
                  <span className="font-semibold tabular-nums">{pendingBatchId}</span>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {onEditListing && (
                  <Button
                    onClick={onEditListing}
                    className="gap-2 shadow-sm"
                  >
                    <Pencil className="h-4 w-4" />
                    {t("productListing.approvalPending.editListing")}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="default"
                  className="gap-2 border-border/60 hover:bg-muted/50"
                  onClick={() => navigate("/dashboard/auto-approval")}
                >
                  <Sparkles className="h-4 w-4" />
                  {t("productListing.approvalPending.subscribeAutoApproval")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Dialog open={showBatchCreatedDialog} onOpenChange={setShowBatchCreatedDialog}>
          <DialogContent className="sm:max-w-md shadow-xl border-border/60">
            <DialogHeader className="space-y-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/15 mx-auto">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500" />
              </div>
              <DialogTitle className="text-center text-lg">
                {t("upload.batchCreatedPopupTitle")}
              </DialogTitle>
              <DialogDescription className="text-center text-muted-foreground leading-relaxed">
                {t("upload.batchCreatedPopupMessage", { batchId: createdBatchId ?? "" })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center">
              <Button onClick={() => setShowBatchCreatedDialog(false)} className="min-w-[120px]">
                {t("common.ok", "OK")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6 animate-in fade-in-50 duration-500">
        {showBackToStatus && onBackToStatus && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {t("productListing.approvalPending.editingPendingNote")}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
              onClick={onBackToStatus}
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              {t("productListing.approvalPending.backToStatus")}
            </Button>
          </div>
        )}
        {/* Header */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-7 bg-gradient-to-b from-accent to-accent-light rounded-full"></div>
            <h1 className="text-xl sm:text-3xl font-bold text-foreground">{t('upload.createSubmission')}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-3">
            {t('upload.addSurplusItems')}
          </p>
        </div>
        {/* Commission (when viewing a submission): seller > batch > global */}
        {batchId && (() => {
          const batch = (batchData?.data as { batch?: { commission_percent?: number | null } } | undefined)?.batch;
          const pct = batch?.commission_percent != null ? Number(batch.commission_percent) : null;
          if (pct == null || pct < 0) return null;
          return (
            <div className="rounded-lg border-2 border-amber-200 bg-amber-50/80 dark:border-amber-800/50 dark:bg-amber-950/30 px-4 py-3 flex flex-wrap items-center gap-2">
              <Percent className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0" />
              <span className="text-base font-semibold text-amber-900 dark:text-amber-100">
                {t("submissions.commission")}: {pct}%
              </span>
            </div>
          );
        })()}
        {/* Items Grid with Preview */}
        <div className="space-y-6">
          {items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side - Form */}
              <div>
                <Card className="border-border/50 hover:border-border transition-all duration-200 hover:shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-6 pb-4 border-b border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center font-bold text-lg">
                          {index + 1}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-foreground">
                            {t("upload.item")} {index + 1}
                          </h2>
                          <p className="text-xs text-muted-foreground">{t("upload.fillDetailsBelow")}</p>
                        </div>
                      </div>
                      {items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRow(item.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {/* Photos & Video Section - Moved to Top */}
                    <div className="mb-6">
                      <div className="mb-3">
                        <Label className="text-sm font-medium">{t("upload.photosAndVideo")}</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("upload.addPhotosVideo")}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1 bg-muted/40 rounded px-2 py-1">
                          {t("upload.mediaLimitsHint")}
                        </p>
                      </div>

                      {item.media.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          {item.media.map((media, mediaIndex) => (
                            <div key={mediaIndex} className="relative aspect-square rounded-lg overflow-hidden border-2 border-border/50 hover:border-accent transition-colors group">
                              {media.type === 'image' ? (
                                <img src={media.url} alt={`Upload ${mediaIndex + 1}`} className="w-full h-full object-cover" onClick={() =>
                                  setItems(prevItems =>
                                    prevItems.map(i =>
                                      i.id === item.id
                                        ? { ...i, selectedMediaIndex: mediaIndex }
                                        : i
                                    )
                                  )
                                } />
                              ) : (
                                <div className="relative w-full h-full">
                                  <video src={media.url} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <Video className="w-8 h-8 text-white" />
                                  </div>
                                </div>
                              )}
                              <button
                                onClick={() => removeMedia(item.id, mediaIndex)}
                                className="absolute top-2 right-2 bg-background/90 hover:bg-destructive/10 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4 text-destructive" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {(item.media.filter(m => m.type === "image").length < 10 || item.media.filter(m => m.type === "video").length < 2) && (
                        <label className="border-2 border-dashed border-border/50 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all group">
                          <ImagePlus className="w-8 h-8 text-muted-foreground mb-2 group-hover:text-accent transition-colors" />
                          <p className="text-sm font-medium text-foreground">{t("upload.addPhotosOrVideo")}</p>
                          <p className="text-xs text-muted-foreground">{t("upload.dragAndDrop")}</p>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handleMediaUpload(item.id, e)}
                          />
                        </label>
                      )}
                      {/* Your other item content here */}
                      <Button
                        onClick={() => handleAIGenerate(item.id)}
                        size="lg"
                        className="bg-gradient-to-r mt-4 from-purple-500 to-purple-400 text-white hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                        disabled={!item.media?.length || item.media?.length < 1}
                      >
                        {item.aiLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            {t("upload.generateWithAI")}
                          </>
                        )}
                      </Button>


                    </div>s

                    {/* File Upload Section */}
                    <div className="mb-6">
                      <Label className="text-sm font-medium">
                        {t("upload.uploadInventoryFile")}{" "}
                        <span className="text-muted-foreground font-normal">({t("upload.optional")})</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mb-1 mt-1">
                        {t("upload.uploadFileTypes")}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mb-3 bg-muted/40 rounded px-2 py-1">
                        {t("upload.documentLimitsHint")}
                      </p>

                      <div className="flex items-center gap-3 flex-wrap">
                        <input
                          type="file"
                          id={`file-upload-${item.id}`}
                          onChange={(e) => handleFileUpload(item.id, e)}
                          className="hidden"
                          multiple // allow multiple file selection
                        />
                        <label htmlFor={`file-upload-${item.id}`}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="cursor-pointer border-border/50 hover:border-accent hover:bg-accent/5"
                            asChild
                          >
                            <span className="flex items-center gap-2">
                              <Upload className="w-4 h-4" />
                              {t("upload.chooseFile")}
                            </span>
                          </Button>
                        </label>

                        {item.documentFile && item.documentFile.length > 0 && (
                          <div className="flex flex-col gap-2 w-full max-w-[300px]">
                            {item.documentFile.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 text-sm text-foreground bg-accent/10 px-3 py-1.5 rounded-md border border-accent/20"
                              >
                                <FileText className="w-4 h-4 text-accent" />
                                <span className="truncate max-w-[200px]">{file.name}</span>
                                <button
                                  onClick={() =>
                                    updateItem(
                                      item.id,
                                      "documentFile",
                                      item.documentFile!.filter((_, i) => i !== index)
                                    )
                                  }
                                  className="ml-2 hover:bg-destructive/10 rounded-full p-1 transition-colors"
                                >
                                  <X className="w-4 h-4 text-destructive" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>


                    {/* Required Info */}
                    <div className="space-y-4">
                      {(() => {
                        // convenience alias for this item’s errors
                        const errorsForItem = itemErrors[item.id] || {};
                        return (
                          <>
                            <div>
                              <Label
                                htmlFor={`title-${item.id}`}
                                className={cn(
                                  "text-sm font-medium",
                                  errorsForItem.title && "text-destructive"
                                )}
                              >
                                {t("upload.title")} <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id={`title-${item.id}`}
                                value={item.title}
                                onChange={(e) =>
                                  updateItem(item.id, "title", e.target.value)
                                }
                                placeholder={t("upload.titlePlaceholder")}
                                className={cn(
                                  "mt-1 border-border/50 focus:border-accent",
                                  errorsForItem.title &&
                                  "border-destructive focus-visible:ring-destructive"
                                )}
                              />
                            </div>

                            <div>
                              <Label
                                htmlFor={`quantity-${item.id}`}
                                className={cn(
                                  "text-sm font-medium",
                                  errorsForItem.quantity && "text-destructive"
                                )}
                              >
                                {t("upload.quantity")}{" "}
                                <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id={`quantity-${item.id}`}
                                type="number"
                                min={1}
                                value={item.quantity === 0 ? "" : item.quantity}
                                onChange={(e) => {
                                  const val = e.target.value;

                                  if (val === "") {
                                    // Allow empty string (prevents default 0)
                                    // Store as 0 internally to keep type, but display empty
                                    updateItem(item.id, "quantity", 0 as any);
                                    return;
                                  }

                                  updateItem(item.id, "quantity", Number(val) as any);
                                }}
                                className={cn(
                                  "mt-1 border-border/50 focus:border-accent",
                                  errorsForItem.quantity &&
                                  "border-destructive focus-visible:ring-destructive"
                                )}
                              />
                            </div>


                            {/* <div className="mt-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={item.enableBuyNow}
                            onCheckedChange={(checked) => {
                              const isChecked = checked === true;
                              updateItem(item.id, "enableBuyNow", isChecked);

                              if (!isChecked) {
                                updateItem(item.id, "priceFormat", "offer");
                                updateItem(item.id, "pricePerUnit", "");
                              }
                            }}
                          />
                          <Label>{t("upload.enablePrice")}</Label>
                        </div>

                        {item.enableBuyNow && (
                          <Select
                            value={item.priceFormat}
                            onValueChange={(val) =>
                              updateItem(item.id, "priceFormat", val as "buyNow" | "offer")
                            }
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="buyNow">{t("upload.buyNow")}</SelectItem>
                              <SelectItem value="offer">{t("upload.acceptOffer")}</SelectItem>
                            </SelectContent>
                          </Select>
                        )}

                        {item.enableBuyNow && item.priceFormat === "buyNow" && (
                          <div className="flex gap-2 mt-2">
                            <Select
                              value={item.priceCurrency}
                              onValueChange={(val) =>
                                updateItem(item.id, "priceCurrency", val as "USD" | "TWD")
                              }
                            >
                              <SelectTrigger className="w-[90px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="TWD">TWD</SelectItem>
                              </SelectContent>
                            </Select>

                            <Input
                              type="number"
                              placeholder={t("upload.pricePerUnit")}
                              value={item.pricePerUnit}
                              onChange={(e) =>
                                updateItem(item.id, "pricePerUnit", e.target.value)
                              }
                            />
                          </div>
                        )}
                      </div> */}



                            {/* Replacement */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              {/* Replacement Cost */}
                              {false &&
                                <div className="relative group">
                                  <label className="text-sm font-medium flex items-center gap-1">
                                    {t("upload.replacementCostPerUnit")}
                                    {/* Green info icon */}
                                    <span className="relative cursor-pointer text-green-600">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm.75 15h-1.5v-1.5h1.5zm0-3h-1.5V7h1.5z" />
                                      </svg>
                                      {/* Tooltip */}
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all bg-gray-800 text-white text-xs rounded-md p-2 z-10">
                                        {t("upload.replacementCostTooltip")}
                                      </div>
                                    </span>
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    className="mt-1 w-full border rounded-md px-3 py-2"
                                    value={item.replacementCostPerUnit}
                                    onChange={(e) =>
                                      updateItem(item.id, "replacementCostPerUnit", e.target.value)
                                    }
                                    placeholder="e.g. 1200"
                                  />
                                </div>
                              }

                              {/* Weight */}
                              {false &&
                                <div className="relative group">
                                  <label className="text-sm font-medium flex items-center gap-1">
                                    {t("upload.weightPerUnit")}
                                    {/* Green info icon */}
                                    <span className="relative cursor-pointer text-green-600">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm.75 15h-1.5v-1.5h1.5zm0-3h-1.5V7h1.5z" />
                                      </svg>
                                      {/* Tooltip */}
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all bg-gray-800 text-white text-xs rounded-md p-2 z-10">
                                        {t("upload.weightPerUnitTooltip")}
                                      </div>
                                    </span>
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="mt-1 w-full border rounded-md px-3 py-2"
                                    value={item.weightPerUnit}
                                    onChange={(e) =>
                                      updateItem(item.id, "weightPerUnit", e.target.value)
                                    }
                                    placeholder="e.g. 2.5"
                                  />
                                </div>
                              }
                            </div>

                            <div className="space-y-2">
                              <Label
                                htmlFor={`parent-category-${item.id}`}
                                className={cn(
                                  "text-sm font-medium",
                                  (errorsForItem.category || errorsForItem.category_name) &&
                                  "text-destructive"
                                )}
                              >
                                {t("upload.category")}{" "}
                                <span className="text-destructive">*</span>
                              </Label>

                              {/* Step 1: Parent category */}
                              <Select
                                value={item.parentCategory}
                                onValueChange={(value) => {
                                  updateItem(item.id, "parentCategory", value);
                                  updateItem(item.id, "category", "");
                                  updateItem(item.id, "category_name", "");
                                }}
                              >
                                <SelectTrigger
                                  id={`parent-category-${item.id}`}
                                  className={cn(
                                    "mt-1 border-border/50 focus:border-accent",
                                    errorsForItem.category &&
                                    !item.parentCategory &&
                                    "border-destructive focus-visible:ring-destructive"
                                  )}
                                >
                                  <SelectValue placeholder={t("upload.selectCategory")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.isArray(data) && data.map((cat: any) => (
                                    <SelectItem key={cat.slug} value={cat.slug}>
                                      {decodeHtml(cat.name)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {/* Step 2: Subcategory (shown once a parent is selected) */}
                              {(() => {
                                const parentCat = Array.isArray(data)
                                  ? data.find((c: any) => c.slug === item.parentCategory)
                                  : null;
                                return parentCat?.subcategories?.length > 0 ? (
                                  <Select
                                    value={item.category}
                                    onValueChange={(value) => {
                                      const sub = parentCat.subcategories.find(
                                        (s: any) => s.id?.toString() === value
                                      );
                                      updateItem(item.id, "category", value);
                                      updateItem(item.id, "category_name", decodeHtml(sub?.name) || "");
                                    }}
                                  >
                                    <SelectTrigger
                                      className={cn(
                                        "border-border/50 focus:border-accent",
                                        errorsForItem.category &&
                                        !item.category &&
                                        "border-destructive focus-visible:ring-destructive"
                                      )}
                                    >
                                      <SelectValue placeholder="Select subcategory" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {parentCat.subcategories.map((sub: any) => (
                                        <SelectItem
                                          key={sub.id}
                                          value={sub.id?.toString()}
                                        >
                                          {decodeHtml(sub.name)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : null;
                              })()}

                              {item.category === "other" && (
                                <Input
                                  className={cn(
                                    "mt-2",
                                    errorsForItem.category_name &&
                                    "border-destructive focus-visible:ring-destructive"
                                  )}
                                  placeholder={t("upload.enterCategory")}
                                  value={item.category_name || ""}
                                  onChange={(e) =>
                                    updateItem(item.id, "category_name", e.target.value)
                                  }
                                />
                              )}
                            </div>

                            {false &&
                              <div>
                                <Label htmlFor={`price-${item.id}`}>{t("upload.priceLabel")}</Label>
                                <div className="space-y-2 mt-1">
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant={item.priceType === "offer" ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => updateItem(item.id, "priceType", "offer")}
                                      className="flex-1"
                                    >
                                      {t("upload.negotiate")}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant={item.priceType === "fixed" ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => updateItem(item.id, "priceType", "fixed")}
                                      className="flex-1"
                                    >
                                      {t("upload.fixedPrice")}
                                    </Button>
                                  </div>

                                  {item.priceType === "fixed" && (
                                    <div className="flex gap-2">
                                      <Select
                                        value={item.currency}
                                        onValueChange={(value) => updateItem(item.id, "currency", value)}
                                      >
                                        <SelectTrigger className="w-[100px]">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="TWD">TWD</SelectItem>
                                          <SelectItem value="USD">USD</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Input
                                        id={`price-${item.id}`}
                                        value={item.estimatedValue}
                                        onChange={(e) => updateItem(item.id, "estimatedValue", e.target.value)}
                                        placeholder="0.00"
                                        type="number"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            }

                            <div className="space-y-1.5">
                              <Label
                                htmlFor={`condition-${item.id}`}
                                className={cn(
                                  "text-sm font-medium",
                                  errorsForItem.condition && "text-destructive"
                                )}
                              >
                                {t("upload.condition")} <span className="text-destructive">*</span>
                              </Label>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <div
                                    className={cn(
                                      "mt-1 border border-border/50 rounded-xl px-3 py-2 cursor-pointer flex flex-wrap gap-2 min-h-[46px] bg-background shadow-sm hover:shadow-md transition-all duration-200",
                                      errorsForItem.condition &&
                                      "border-destructive ring-1 ring-destructive/40"
                                    )}
                                  >
                                    {Array.isArray(item?.condition) && item.condition?.length > 0 ? (
                                      normalizeCondition(item.condition).map((cond) => (
                                        <span
                                          key={cond}
                                          className="flex items-center gap-1 bg-accent text-accent-foreground  text-xs px-3 py-1 rounded-full shadow-sm hover:shadow transition-all duration-200"
                                        >
                                          {VALID_CONDITION_KEYS.includes(cond as any) ? t(`upload.conditionOptions.${cond}`) : cond}

                                          {/* Remove icon */}
                                          <X
                                            size={12}
                                            className="cursor-pointer hover:text-red-500 transition"
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const updated = (item.condition || []).filter((c) => c !== cond);
                                              updateItem(item.id, "condition", updated);
                                            }}
                                          />
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-muted-foreground text-sm">
                                        {t("upload.selectCondition")}
                                      </span>
                                    )}
                                  </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="start"
                                  className="w-60 rounded-xl shadow-xl border border-border bg-popover p-2 z-[9999]"
                                >
                                  {[
                                    "new",
                                    "usedFunctional",
                                    "forParts",
                                    "wasteDisposal",
                                    "demolitionRemoval",
                                  ].map((cond) => (
                                    <DropdownMenuCheckboxItem
                                      key={cond}
                                      checked={normalizeCondition(item.condition || []).includes(cond)}
                                      onCheckedChange={(checked) => {
                                        const currentConditions = normalizeCondition(item.condition || []);

                                        const updated = checked
                                          ? (currentConditions.includes(cond) ? currentConditions : [...currentConditions, cond])
                                          : currentConditions.filter((c) => c !== cond);
    
                                        updateItem(item.id, "condition", updated);
                                      }}
                                      className="rounded-md px-3 py-2 text-sm font-medium cursor-pointer  hover:bg-muted/70 transition-all duration-150"
                                    >
                                      {t(`upload.conditionOptions.${cond}`)}
                                    </DropdownMenuCheckboxItem>

                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="space-y-1.5">
                              <Label
                                htmlFor={`operation-${item.id}`}
                                className={cn(
                                  "text-sm font-semibold text-foreground",
                                  errorsForItem.operationStatus && "text-destructive"
                                )}
                              >
                                {t("upload.operationStatus")} <span className="text-destructive">*</span>
                              </Label>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <div
                                    className={cn(
                                      "mt-1 border border-border rounded-xl px-3 py-2 cursor-pointer flex flex-wrap gap-2 min-h-[46px] bg-background shadow-sm hover:shadow-md transition-all duration-200",
                                      errorsForItem.operationStatus &&
                                      "border-destructive ring-1 ring-destructive/40"
                                    )}
                                  >
                                    {Array.isArray(item?.operationStatus) && item.operationStatus?.length > 0 ? (
                                      item.operationStatus.map((status, idx) => (
                                        <span
                                          key={idx}
                                          className="flex items-center gap-1 bg-accent text-accent-foreground 
                         text-xs px-3 py-1 rounded-full shadow-sm hover:shadow 
                         transition-all duration-200"
                                        >
                                          {t(`upload.operationStatusOptions.${status}`)}

                                          <X
                                            size={12}
                                            className="cursor-pointer hover:text-red-500 transition"
                                            onPointerDown={(e) => e.stopPropagation()} // BLOCK dropdown trigger
                                            onMouseDown={(e) => e.stopPropagation()}   // BLOCK open event
                                            onClick={(e) => {
                                              e.stopPropagation(); // final safety
                                              const updated = item.operationStatus.filter(
                                                (s) => s !== status
                                              );
                                              updateItem(item.id, "operationStatus", updated);
                                            }}
                                          />
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-muted-foreground text-sm">
                                        {t("upload.selectStatus")}
                                      </span>
                                    )}
                                  </div>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                  align="start"
                                  className="w-60 rounded-xl shadow-xl border border-border bg-popover p-2 z-[9999]"
                                >
                                  {["deinstalled", "needDeinstall", "collected", "other"].map(
                                    (status) => (
                                      <DropdownMenuCheckboxItem
                                        key={status}
                                        checked={item.operationStatus.includes(status)}
                                        onCheckedChange={(checked) => {
                                          const updated = checked
                                            ? [...item.operationStatus, status]
                                            : item.operationStatus.filter((s) => s !== status);

                                          updateItem(item.id, "operationStatus", updated);
                                        }}
                                        className="rounded-md px-3 py-2 text-sm font-medium cursor-pointer
                       hover:bg-muted/70 transition-all duration-150"
                                      >
                                        {t(`upload.operationStatusOptions.${status}`)}
                                      </DropdownMenuCheckboxItem>
                                    )
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div>
                              <Label
                                htmlFor={`description-${item.id}`}
                                className={cn(
                                  "text-sm font-medium",
                                  errorsForItem.description && "text-destructive"
                                )}
                              >
                                {t("upload.description")}
                                <span className="text-destructive">*</span>
                              </Label>
                              <div className="mt-1">
                                <SunEditor
                                  setContents={item.description}
                                  onChange={(content) => updateItem(item.id, "description", content)}
                                  setOptions={{
                                    height: "250",
                                    buttonList: [
                                      ["undo", "redo"],
                                      ["font", "fontSize", "formatBlock"],
                                      ["bold", "underline", "italic", "strike", "subscript", "superscript"],
                                      ["fontColor", "hiliteColor"],
                                      ["outdent", "indent"],
                                      ["align", "horizontalRule", "list", "lineHeight"],
                                      ["table", "link", "image"],
                                      ["fullScreen", "showBlocks", "codeView"],
                                      ["removeFormat"],
                                    ],
                                  }}
                                />
                              </div>
                            </div>

                            {/* <div>
                        <Label htmlFor={`seller-name-${item.id}`}>{t("upload.sellerNameLabel")} ({t("upload.optional")})</Label>
                        <Input
                          id={`seller-name-${item.id}`}
                          value={item.sellerName}
                          onChange={(e) => updateItem(item.id, "sellerName", e.target.value)}
                          placeholder={t("upload.sellerNamePlaceholder")}
                          className="mt-1"
                        />
                      </div> */}

                            <div className="flex items-center gap-2 mt-3">
                              <input
                                type="checkbox"
                                id={`sellerVisible-${item.id}`}
                                checked={
                                  item.sellerVisible === undefined ||
                                  item.sellerVisible === "1" ||
                                  item.sellerVisible === true
                                }
                                onChange={(e) =>
                                  updateItem(
                                    item.id,
                                    "sellerVisible",
                                    e.target.checked ? "1" : ""
                                  )
                                }
                                className="h-4 w-4"
                              />

                              <Label
                                htmlFor={`sellerVisible-${item.id}`}
                                className="text-sm"
                              >
                                {t("upload.sellerVisible")}
                              </Label>
                            </div>

                            {/* Location */}
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Checkbox
                                  id={`multiple-${item.id}`}
                                  checked={multipleLocations[item.id] || false}
                                  onCheckedChange={(checked) =>
                                    setMultipleLocations({
                                      ...multipleLocations,
                                      [item.id]: checked as boolean,
                                    })
                                  }
                                />
                                <Label htmlFor={`multiple-${item.id}`} className="text-muted-foreground">
                                  {t("upload.multipleLocations")}
                                </Label>
                              </div>

                              <div className="space-y-3">
                                {item.locations.map((location, locIndex) => (
                                  <div key={location.id} className="flex gap-2">
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <Label
                                          htmlFor={`address-${item.id}-${location.id}`}
                                          className={cn(
                                            errorsForItem.address && "text-destructive"
                                          )}
                                        >
                                          {t("upload.addressLabel")} *
                                        </Label>
                                        {savedAddress && location.address === savedAddress && (
                                          <span className="text-xs text-accent flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            Autofilled
                                          </span>
                                        )}
                                      </div>
                                      <Input
                                        id={`address-${item.id}-${location.id}`}
                                        value={location.address}
                                        onChange={(e) =>
                                          updateLocation(
                                            item.id,
                                            location.id,
                                            "address",
                                            e.target.value
                                          )
                                        }
                                        placeholder={t("upload.addressPlaceholder")}
                                        className={cn(
                                          "mt-1",
                                          errorsForItem.address &&
                                          "border-destructive focus-visible:ring-destructive"
                                        )}
                                      />
                                      {/* Country select */}
                                      <div className="mt-2">
                                        <Label htmlFor={`country-${item.id}-${location.id}`}>
                                          Country
                                        </Label>
                                        <Select
                                          value={location.country || ""}
                                          onValueChange={(val) =>
                                            updateLocation(item.id, location.id, "country", val)
                                          }
                                        >
                                          <SelectTrigger id={`country-${item.id}-${location.id}`} className="mt-1 border-border/50 focus:border-accent">
                                            <SelectValue placeholder="Select country" />
                                          </SelectTrigger>
                                          <SelectContent className="max-h-60">
                                            <CountrySelectItems />
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    {multipleLocations[item.id] && item.locations.length > 1 && (
                                      <div className="flex items-end">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeLocation(item.id, location.id)}
                                        >
                                          <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ))}

                                {multipleLocations[item.id] && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addLocation(item.id)}
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    {t("upload.addLocation")}
                                  </Button>
                                )}
                              </div>
                            </div>


                            {/* Publishing Sites */}
                            {/* <div className="mt-3">
                        <label className="text-sm font-medium">
                          {t("upload.allowedSites")}
                        </label>

                        <div className="mt-2 space-y-1">
                          {ALLOWED_SITES_OPTIONS.map(site => (
                            <label key={site.value} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={item.allowedSites.includes(site.value)}
                                onChange={(e) => {
                                  const updated = e.target.checked
                                    ? [...item.allowedSites, site.value]
                                    : item.allowedSites.filter(v => v !== site.value);

                                  updateItem(item.id, "allowedSites", updated);
                                }}
                              />
                              <span>{t(`upload.publishingSiteLabels.${site.value}`, site.value)}</span>
                            </label>
                          ))}
                        </div>
                      </div>  */}


                            {/* <Card className="border-border/50">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-1 h-5 bg-accent rounded-full"></div>
                            <Label className="text-sm font-medium">{t("batch.selectVisibility", "Select who can see this batch:")}</Label>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div
                              className={`border rounded-lg p-4 cursor-pointer transition-all ${batchVisibility === 'PUBLIC'
                                ? 'border-accent bg-accent/5'
                                : 'border-border/50 hover:border-accent/50'
                                }`}
                              onClick={() => setBatchVisibility('PUBLIC')}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <input
                                  type="radio"
                                  checked={batchVisibility === 'PUBLIC'}
                                  onChange={() => setBatchVisibility('PUBLIC')}
                                  className="text-accent"
                                />
                                <span className="font-medium text-sm">{t("batch.public", "Public")}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{t("batch.publicDesc", "Visible to all users")}</p>
                            </div>

                            <div
                              className={`border rounded-lg p-4 cursor-pointer transition-all ${batchVisibility === 'PRIVATE'
                                ? 'border-accent bg-accent/5'
                                : 'border-border/50 hover:border-accent/50'
                                }`}
                              onClick={() => setBatchVisibility('PRIVATE')}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <input
                                  type="radio"
                                  checked={batchVisibility === 'PRIVATE'}
                                  onChange={() => setBatchVisibility('PRIVATE')}
                                  className="text-accent"
                                />
                                <span className="font-medium text-sm">{t("batch.private", "Private")}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {t("batch.privateDesc", "Visible only to you and users with your management role")}
                              </p>

                            </div>

                            <div
                              className={`border rounded-lg p-4 cursor-pointer transition-all ${batchVisibility === 'NETWORK'
                                ? 'border-accent bg-accent/5'
                                : 'border-border/50 hover:border-accent/50'
                                }`}
                              onClick={() => setBatchVisibility('NETWORK')}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <input
                                  type="radio"
                                  checked={batchVisibility === 'NETWORK'}
                                  onChange={() => setBatchVisibility('NETWORK')}
                                  className="text-accent"
                                />
                                <span className="font-medium text-sm">{t("batch.network", "Network")}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{t("batch.networkDesc", "Accessible only to those included in your seller network")}</p>
                            </div>
                          </div>



                        </CardContent>
                      </Card> */}

                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:sticky lg:top-24 h-fit">
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border/50">
                      <div className="p-2 rounded-lg bg-accent/10 text-accent">
                        <Package className="w-4 h-4" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{t("upload.preview")}</h3>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-8 text-center mb-4">
                      {item.media.length > 0 ? (
                        item.media[0].type === 'image' ? (
                          <img
                            // src={item.media[0].url} 
                            src={item.media[item.selectedMediaIndex].url}
                            alt="Preview" className="w-full rounded-lg" />
                        ) : (
                          <div className="relative">
                            <video src={item.media[0].url} className="w-full rounded-lg" controls />
                          </div>
                        )
                      ) : (
                        <div className="text-muted-foreground py-12">
                          <p className="font-semibold mb-1">{t("upload.listingPreview")}</p>
                          <p className="text-sm">{t("upload.previewDescription")}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-2xl font-bold text-foreground">
                          {item.title || t("upload.title")}
                        </h4>
                        {/* <p className="text-xl font-semibold text-foreground mt-1">
                          {item.priceType === "offer"
                            ? t("upload.negotiate")
                            : (item.estimatedValue ? `${item.currency} ${item.estimatedValue}` : t("upload.priceLabel"))}
                        </p> */}
                        {/* <p className="text-sm text-muted-foreground mt-1">
                          {t("upload.listedAgo")} {item.locations[0]?.address || t("upload.location")}
                        </p> */}
                      </div>

                      {(item.description || item.category || item.condition) && (
                        <div className="border-t border-border pt-3">
                          <h5 className="font-semibold text-foreground mb-1">{t("upload.details")}</h5>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.description}
                            </p>
                          )}
                          {item.category && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">{t("upload.category")}:</span> {item.category}
                            </p>
                          )}
                          {item.condition && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">{t("upload.condition")}:</span> {item.condition}
                            </p>
                          )}
                        </div>
                      )}



                      <div className="mt-2 text-sm">
                        <p>
                          <span className="text-sm ">
                            {t("upload.replacementCost")}
                          </span>{" "}
                          {item.replacementCostPerUnit}
                        </p>

                        <p>
                          <span className="text-sm ">
                            {t("upload.weightPerUnitLabel")}
                          </span>{" "}
                          {item.weightPerUnit} kg
                        </p>
                      </div>




                      {item.enableBuyNow && item.buyNowPrice && (
                        <div>
                          <span className="text-sm text-muted-foreground">
                            {item.buyNowCurrency} {item.buyNowPrice}
                          </span>
                          <span className="ml-2 text-sm text-muted-foreground">
                            Buy Now
                          </span>
                        </div>
                      )}

                      <div className="border-t border-border pt-3">
                        <h5 className="font-semibold text-foreground mb-2">{t("upload.sellerInformation")}</h5>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-sm font-semibold">
                              {sellerName ? sellerName.charAt(0).toUpperCase() : "S"}
                            </span>
                          </div>
                          <p className="font-medium text-sm">{sellerName || t("upload.sellerNameLabel")}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>



        {/* Add Item Button */}
        {Number(urlFinalStep) < 6 &&
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/50">
            {/* <Button
              variant="outline"
              onClick={addRow}
              className="hover:bg-info/10 hover:text-info hover:border-info transition-colors border-border/50"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("upload.addAnotherItem")}
            </Button> */}
            <Button
              onClick={handleConfirm}
              size="lg"
              className="ml-auto bg-gradient-to-r from-accent to-accent-light text-white hover:shadow-accent transition-all duration-300 hover:scale-105 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  {t("upload.uploading")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {batchData
                    ? t("steps.step1.updateContinue")
                    : t("steps.step1.confirmContinue")
                  }
                </>
              )}
            </Button>


          </div>
        }

      </div>


      {aiPreview && currentAiItemId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              {t("aiPreview.modalTitle")}
            </h2>

            <div className="space-y-2 mb-4 text-sm text-gray-700">
              <p><strong>{t("aiPreview.fields.title")}:</strong> {aiPreview.ai.name}</p>
              <p><strong>{t("aiPreview.fields.description")}:</strong> {aiPreview.ai.equipment_description}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {aiPreview.files.map((img, i) => (
                <img key={i} src={img.url} className="rounded-md h-20 w-full object-cover" />
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-md bg-gray-200"
                onClick={() => setAiPreview(null)}
              >
                {t("aiPreview.regenerate")}
              </button>

              <button
                className="px-4 py-2 rounded-md bg-purple-600 text-white"
                onClick={() => {
                  if (!currentAiItemId) return;

                  setItems(prevItems =>
                    prevItems.map(item =>
                      item.id === currentAiItemId
                        ? {
                          ...item,
                          title: aiPreview.ai.name,
                          description: aiPreview.ai.equipment_description,
                          condition: normalizeCondition(aiPreview.ai.condition),
                          operationStatus: aiPreview.ai.operation_status,
                          estimatedValue: aiPreview.ai.price?.reselling_price,
                          currency: aiPreview.ai.currency,
                          aiLoading: false,
                        }
                        : item
                    )
                  );

                  setAiPreview(null);
                  setCurrentAiItemId(null);
                  toast.success(t("aiPreview.successToast"));
                }}
              >
                {t("aiPreview.confirmApply")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion popup: Your product and batch is created */}
      <Dialog open={showBatchCreatedDialog} onOpenChange={setShowBatchCreatedDialog}>
        <DialogContent className="sm:max-w-md shadow-xl border-border/60">
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/15">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500" />
            </div>
            <DialogTitle className="text-center text-lg">
              {t("upload.batchCreatedPopupTitle")}
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground leading-relaxed">
              {t("upload.batchCreatedPopupMessage", { batchId: createdBatchId ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setShowBatchCreatedDialog(false)} className="min-w-[120px]">
              {t("common.ok", "OK")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
};


export default UploadMethod;
