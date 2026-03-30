import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Upload, FileText, X, ImagePlus, Video, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/greenbidz_logo.png";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";

interface MediaFile {
  url: string;
  type: 'image' | 'video';
}

interface Location {
  id: string;
  address: string;
}



interface InventoryItem {
  id: string;
  category: string;
  title: string;
  description: string;
  condition: string;
  operationStatus: string;
  locations: Location[];
  estimatedValue: string;
  currency: string;
  media: MediaFile[];
  sellerName: string;
  priceType: "fixed" | "offer";
}

const UploadMethod = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [items, setItems] = useState<InventoryItem[]>([
    {
      id: "1",
      category: "",
      title: "",
      description: "",
      condition: "",
      operationStatus: "",
      locations: [{ id: "1", address: "" }],
      estimatedValue: "",
      currency: "USD",
      media: [],
      sellerName: "",
      priceType: "fixed",
    },
  ]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [multipleLocations, setMultipleLocations] = useState<{ [key: string]: boolean }>({});

  const addRow = () => {
    const newId = Date.now().toString();
    setItems([
      ...items,
      {
        id: newId,
        category: "",
        title: "",
        description: "",
        condition: "",
        operationStatus: "",
        locations: [{ id: "1", address: "" }],
        estimatedValue: "",
        currency: "USD",
        media: [],
        sellerName: "",
        priceType: "fixed",
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InventoryItem, value: string | MediaFile[]) => {
    setItems(
      items.map((item) =>
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast.success(t('steps.step1.fileUploadSuccess', { fileName: file.name }));
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    toast.success(t('steps.step1.fileRemoved'));
  };

  const handleMediaUpload = (itemId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const currentMediaCount = item.media.length;
    const availableSlots = 11 - currentMediaCount; // 10 photos + 1 video

    if (availableSlots <= 0) {
      toast.error(t('steps.step1.maxPhotosVideos'));
      return;
    }

    const newMedia: MediaFile[] = [];
    const filesToProcess = Math.min(files.length, availableSlots);
    let processedCount = 0;

    Array.from(files).slice(0, filesToProcess).forEach((file) => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');

      if (!isVideo && !isImage) {
        toast.error(t('steps.step1.invalidFile', { fileName: file.name }));
        processedCount++;
        return;
      }

      // Check if already have a video
      const hasVideo = item.media.some(m => m.type === 'video');
      if (isVideo && hasVideo) {
        toast.error(t('steps.step1.onlyOneVideo'));
        processedCount++;
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newMedia.push({
            url: e.target.result as string,
            type: isVideo ? 'video' : 'image'
          });
          processedCount++;
          
          if (processedCount === filesToProcess) {
            updateItem(itemId, "media", [...item.media, ...newMedia]);
            const imageCount = newMedia.filter(m => m.type === 'image').length;
            const videoCount = newMedia.filter(m => m.type === 'video').length;
            if (imageCount > 0 && videoCount > 0) {
              toast.success(t('steps.step1.mediaAdded', { photoCount: imageCount, videoCount }));
            } else if (imageCount > 0) {
              toast.success(t('steps.step1.photosAdded', { count: imageCount }));
            } else if (videoCount > 0) {
              toast.success(t('steps.step1.videosAdded', { count: videoCount }));
            }
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (itemId: string, mediaIndex: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const updatedMedia = item.media.filter((_, index) => index !== mediaIndex);
    updateItem(itemId, "media", updatedMedia);
  };

  const handleConfirm = () => {
    const hasEmptyFields = items.some(
      (item) =>
        !item.category ||
        !item.title ||
        !item.condition ||
        !item.operationStatus ||
        item.locations.some((loc) => !loc.address)
    );

    if (hasEmptyFields) {
      toast.error(t('steps.step1.fillRequired'));
      return;
    }

    toast.success(t('steps.step1.inventoryConfirmed'));
    navigate("/inspection-price");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-gradient-card sticky top-0 z-10 shadow-medium backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src={logo} 
                alt="GreenBidz" 
                className="h-8 w-auto cursor-pointer hover:scale-105 transition-transform"
                onClick={() => navigate("/")}
              />
              <h1 className="text-xl font-bold bg-gradient-accent bg-clip-text text-transparent">{t('upload.itemForSale')}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="hover:bg-success/10 hover:text-success hover:border-success transition-colors"
                onClick={() => {
                  toast.success(t('steps.step1.draftSaved'));
                  navigate("/dashboard");
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('steps.step1.saveReturnDashboard')}
              </Button>
              <Button 
                variant="ghost" 
                className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={() => navigate("/dashboard")}
              >
                {t('steps.step1.cancel')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Items Grid with Preview */}
        <div className="space-y-6">
          {items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side - Form */}
              <div>
                <Card className="shadow-medium hover:shadow-accent transition-all duration-300 border-l-4 border-l-accent animate-slide-up">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-6">
                      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center text-white text-sm">
                          {index + 1}
                        </span>
                        {t('upload.item')}
                      </h2>
                      {items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRow(item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    {/* Photos & Video Section - Moved to Top */}
                    <div className="mb-6">
                      <div className="mb-2">
                        <Label>{t('steps.step1.photosVideoLabel')}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t('upload.addPhotosVideo')} · {t('steps.step1.photosVideoCount', { photoCount: item.media.filter(m => m.type === 'image').length, videoCount: item.media.filter(m => m.type === 'video').length })}
                        </p>
                      </div>

                      {item.media.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          {item.media.map((media, mediaIndex) => (
                            <div key={mediaIndex} className="relative aspect-square rounded-lg overflow-hidden border-2 border-border">
                              {media.type === 'image' ? (
                                <img src={media.url} alt={`Upload ${mediaIndex + 1}`} className="w-full h-full object-cover" />
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
                                className="absolute top-2 right-2 bg-background/80 hover:bg-background rounded-full p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {item.media.length < 11 && (
                        <label className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                          <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
                          <p className="text-sm font-medium text-foreground">{t('steps.step1.addPhotosOrVideo')}</p>
                          <p className="text-xs text-muted-foreground">{t('steps.step1.orDragDrop')}</p>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handleMediaUpload(item.id, e)}
                          />
                        </label>
                      )}
                    </div>

                    {/* File Upload Section */}
                    <div className="mb-6">
                      <Label className="text-sm font-medium">{t('steps.step1.uploadInventory')} <span className="text-muted-foreground font-normal">({t('common.optional')})</span></Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        {t('steps.step1.uploadFileDesc')}
                      </p>

                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          id={`file-upload-${item.id}`}
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <label htmlFor={`file-upload-${item.id}`}>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            className="cursor-pointer"
                            asChild
                          >
                            <span className="flex items-center gap-2">
                              <Upload className="w-4 h-4" />
                              {t('upload.chooseFile')}
                            </span>
                          </Button>
                        </label>
                        {uploadedFile && (
                          <div className="flex items-center gap-2 text-sm text-foreground bg-accent/10 px-3 py-1.5 rounded-md border border-border">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="truncate max-w-[200px]">{uploadedFile.name}</span>
                            <button
                              onClick={removeUploadedFile}
                              className="ml-2 hover:bg-destructive/10 rounded-full p-1 transition-colors"
                              title={t('steps.step1.deleteFile')}
                            >
                              <X className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Required Info */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`title-${item.id}`}>{t('steps.step1.titleRequired')}</Label>
                        <Input
                          id={`title-${item.id}`}
                          value={item.title}
                          onChange={(e) => updateItem(item.id, "title", e.target.value)}
                          placeholder={t('upload.titlePlaceholder')}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`category-${item.id}`}>{t('steps.step1.categoryRequired')}</Label>
                        <Select
                          value={item.category}
                          onValueChange={(value) => updateItem(item.id, "category", value)}
                        >
                          <SelectTrigger id={`category-${item.id}`} className="mt-1">
                            <SelectValue placeholder={t('upload.selectCategory')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mix-lot">Mix lot 混合批次</SelectItem>
                            <SelectItem value="mixed-industrial">Mixed Industrial Waste 混合工業廢棄物</SelectItem>
                            <SelectItem value="metal-scrap">Metal Scrap 金屬廢料</SelectItem>
                            <SelectItem value="plastic-scrap">Plastic Scrap 塑膠廢料</SelectItem>
                            <SelectItem value="paper-cardboard">Paper & Cardboard Waste 紙類及紙板廢棄物</SelectItem>
                            <SelectItem value="glass">Glass Waste 玻璃廢棄物</SelectItem>
                            <SelectItem value="wood">Wood Waste 木材廢棄物</SelectItem>
                            <SelectItem value="textile-fabric">Textile & Fabric Waste 紡織及布料廢棄物</SelectItem>
                            <SelectItem value="rubber-tire">Rubber & Tire Waste 橡膠及輪胎廢棄物</SelectItem>
                            <SelectItem value="electronic">Electronic Waste (E-waste) 電子廢棄物</SelectItem>
                            <SelectItem value="industrial-equipment">Industrial Equipment & Machinery 工業設備及機械</SelectItem>
                            <SelectItem value="construction-demolition">Construction & Demolition Waste 建築及拆除廢棄物</SelectItem>
                            <SelectItem value="organic-food">Organic & Food Waste 有機及食物廢棄物</SelectItem>
                            <SelectItem value="waste-oils">Waste Oils & Lubricants 廢油及潤滑油</SelectItem>
                            <SelectItem value="chemical-solvent">Chemical & Solvent Waste 化學品及溶劑廢棄物</SelectItem>
                            <SelectItem value="paint-ink-coating">Paint, Ink & Coating Waste 油漆、墨水及塗料廢棄物</SelectItem>
                            <SelectItem value="batteries">Batteries & Accumulators 電池及蓄電池</SelectItem>
                            <SelectItem value="medical-clinical">Medical / Clinical Waste 醫療/臨床廢棄物</SelectItem>
                            <SelectItem value="hazardous">Special / Hazardous Waste (Other) 特殊/危險廢棄物（其他）</SelectItem>
                            <SelectItem value="residual">Residual / Non-recyclable Waste 殘餘/不可回收廢棄物</SelectItem>
                            <SelectItem value="other">Other (Please Specify) 其他（請註明）</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor={`price-${item.id}`}>{t('steps.step1.priceLabel')}</Label>
                        <div className="space-y-2 mt-1">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={item.priceType === "offer" ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateItem(item.id, "priceType", "offer")}
                              className="flex-1"
                            >
                              {t('steps.step1.negotiate')}
                            </Button>
                            <Button
                              type="button"
                              variant={item.priceType === "fixed" ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateItem(item.id, "priceType", "fixed")}
                              className="flex-1"
                            >
                              {t('steps.step1.fixedPrice')}
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
                          <p className="text-xs text-muted-foreground mt-2">
                            {t('upload.aiCurrencyNote')}
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor={`condition-${item.id}`}>Condition 狀況 *</Label>
                        <Select
                          value={item.condition}
                          onValueChange={(value) => updateItem(item.id, "condition", value)}
                        >
                          <SelectTrigger id={`condition-${item.id}`} className="mt-1">
                            <SelectValue placeholder="Select condition 選擇狀況" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New 全新</SelectItem>
                            <SelectItem value="like-new">Like New 近乎全新</SelectItem>
                            <SelectItem value="excellent">Excellent 優良</SelectItem>
                            <SelectItem value="good">Good 良好</SelectItem>
                            <SelectItem value="fair">Fair 尚可</SelectItem>
                            <SelectItem value="for-parts">For Parts 零件用</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor={`operation-${item.id}`}>Operation Status 操作狀態 *</Label>
                        <Select
                          value={item.operationStatus}
                          onValueChange={(value) => updateItem(item.id, "operationStatus", value)}
                        >
                          <SelectTrigger id={`operation-${item.id}`} className="mt-1">
                            <SelectValue placeholder="Select status 選擇狀態" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="deinstalled">Deinstalled 已拆卸</SelectItem>
                            <SelectItem value="need-deinstall">Need to Deinstall 需要拆卸</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Description 描述</Label>
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

                      <div>
                        <Label htmlFor={`seller-name-${item.id}`}>Seller Name 賣家名稱 (Optional 可選)</Label>
                        <Input
                          id={`seller-name-${item.id}`}
                          value={item.sellerName}
                          onChange={(e) => updateItem(item.id, "sellerName", e.target.value)}
                          placeholder="Company or seller name 公司或賣家名稱"
                          className="mt-1"
                        />
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
                            多個地點（選填）
                          </Label>
                        </div>

                        <div className="space-y-3">
                          {item.locations.map((location, locIndex) => (
                            <div key={location.id} className="flex gap-2">
                              <div className="flex-1">
                                <Label htmlFor={`address-${item.id}-${location.id}`}>
                                  地址 {locIndex + 1} *
                                </Label>
                                <Input
                                  id={`address-${item.id}-${location.id}`}
                                  value={location.address}
                                  onChange={(e) =>
                                    updateLocation(item.id, location.id, "address", e.target.value)
                                  }
                                  placeholder="輸入地址"
                                  className="mt-1"
                                />
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
                              新增地點
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:sticky lg:top-24 h-fit">
                <Card className="shadow-medium">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Preview 預覽</h3>

                    <div className="bg-muted/30 rounded-lg p-8 text-center mb-4">
                      {item.media.length > 0 ? (
                        item.media[0].type === 'image' ? (
                          <img src={item.media[0].url} alt="Preview" className="w-full rounded-lg" />
                        ) : (
                          <div className="relative">
                            <video src={item.media[0].url} className="w-full rounded-lg" controls />
                          </div>
                        )
                      ) : (
                        <div className="text-muted-foreground py-12">
                          <p className="font-semibold mb-1">Your listing preview 您的刊登預覽</p>
                          <p className="text-sm">As you create your listing, you can preview</p>
                          <p className="text-sm">how it will appear to others on Marketplace.</p>
                          <p className="text-sm">當您建立刊登時，可以預覽它在市集上的顯示方式</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-2xl font-bold text-foreground">
                          {item.title || "Title 標題"}
                        </h4>
                        <p className="text-xl font-semibold text-foreground mt-1">
                          {item.priceType === "offer" 
                            ? "議價" 
                            : (item.estimatedValue ? `${item.currency} ${item.estimatedValue}` : "價格")}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Listed a few seconds ago in {item.locations[0]?.address || "Location 地點"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          幾秒前刊登於 {item.locations[0]?.address || "地點"}
                        </p>
                      </div>

                      {(item.description || item.category || item.condition) && (
                        <div className="border-t border-border pt-3">
                          <h5 className="font-semibold text-foreground mb-1">Details 詳情</h5>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.description}
                            </p>
                          )}
                          {item.category && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Category 類別:</span> {item.category}
                            </p>
                          )}
                          {item.condition && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Condition 狀況:</span> {item.condition}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="border-t border-border pt-3">
                        <h5 className="font-semibold text-foreground mb-2">Seller information 賣家資訊</h5>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-sm font-semibold">
                              {item.sellerName ? item.sellerName.charAt(0).toUpperCase() : "S"}
                            </span>
                          </div>
                          <p className="font-medium text-sm">{item.sellerName || "Seller Name 賣家名稱"}</p>
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
        <div className="mt-6 flex gap-3">
          <Button 
            variant="outline" 
            onClick={addRow}
            className="hover:bg-info/10 hover:text-info hover:border-info transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Item 新增另一個項目
          </Button>
          <Button 
            onClick={handleConfirm} 
            size="lg" 
            className="ml-auto bg-gradient-accent text-white hover:shadow-accent transition-all duration-300 hover:scale-105"
          >
            {t('steps.step1.confirmContinue')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadMethod;
