import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, Descriptions, Tag, Button, Typography, Space, Modal, Form, Input, Select, message } from "antd";
import { ArrowLeftOutlined, ReloadOutlined, EditOutlined } from "@ant-design/icons";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import { useGetAdminUserDetailsQuery } from "@/rtk/slices/adminApiSlice";
import { useUpdateUserSettingsMutation } from "@/rtk/slices/apiSlice";
import { extractValuesFromPhpSerialized } from "@/utils/parsePhpSerializedUrl";

const { Title, Text } = Typography;

const statusColor = (status?: string) => {
  const s = String(status || "").toLowerCase();
  if (s === "approved" || s === "active") return "green";
  if (s === "pending") return "gold";
  if (s === "deactive" || s === "deactivated") return "red";
  return "blue";
};

const AdminUserDetails = () => {
  const { sidebarCollapsed } = useAdminSidebar();
  const navigate = useNavigate();
  const params = useParams();
  const userId = Number(params.userId);

  const { data, isLoading, isFetching, isError, refetch } = useGetAdminUserDetailsQuery(userId, {
    skip: !userId,
  });
  const [updateUserSettings, { isLoading: saving }] = useUpdateUserSettingsMutation();

  const [editOpen, setEditOpen] = useState(false);
  const [form] = Form.useForm();

  const user = data?.data;
  const meta = user?.meta || {};

  const company = user?.company || meta.greenbidz_company || null;
  const memberIdValue = user?.member_id || meta.member_id || null;
  const country = user?.country || meta.greenbidz_address_country || null;
  const address = user?.address || [
    meta.greenbidz_address_street,
    meta.greenbidz_address_city,
    meta.greenbidz_address_district,
    meta.greenbidz_address_postal_code,
  ].filter(Boolean).join(", ") || null;

  const currentLang = meta.language?.startsWith("zh") ? "zh-TW" : (meta.language || "en");

  const documentLinks = useMemo(() => {
    const docs = user?.documents || {};
    const items: Array<{ label: string; urls: string[] }> = [];
    const add = (label: string, raw?: string | null) => {
      if (!raw) return;
      const urls = extractValuesFromPhpSerialized(raw);
      if (urls.length) items.push({ label, urls });
    };
    add("Waste disposal permit", docs.waste_disposal_permit ?? null);
    add("Business registration certificate", docs.business_reg_certificate ?? null);
    return items;
  }, [user?.documents]);

  const openEdit = () => {
    form.setFieldsValue({
      firstName: user?.name || "",
      phone: user?.phone || "",
      company: company || "",
      language: currentLang,
      timezone: meta.timezone || "Asia/Taipei",
      currency: meta.currency || "TWD",
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const res = await updateUserSettings({ ...values, userId }).unwrap();
      if (res.success) {
        message.success("User updated successfully");
        setEditOpen(false);
        refetch();
      } else {
        message.error(res.message || "Update failed");
      }
    } catch {
      message.error("Update failed");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      <AdminSidebar activePath="/admin/users" />
      <div className={sidebarCollapsed ? "lg:ml-16 transition-all duration-300" : "lg:ml-64 transition-all duration-300"}>
        <AdminHeader />

        <div className="p-4 lg:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <Title level={3} style={{ margin: 0 }}>User Details</Title>
              <Text type="secondary">View complete profile & metadata</Text>
            </div>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Back</Button>
              <Button icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>Refresh</Button>
              {user && (
                <Button type="primary" icon={<EditOutlined />} onClick={openEdit}>Edit User</Button>
              )}
            </Space>
          </div>

          <Card loading={isLoading} className="shadow-md border-0 rounded-xl overflow-hidden">
            {isError || !user ? (
              <div className="py-10 text-center">
                <Title level={5} style={{ marginBottom: 8 }}>Failed to load user details</Title>
                <Button onClick={() => refetch()} icon={<ReloadOutlined />}>Try again</Button>
              </div>
            ) : (
              <>
                <Descriptions
                  bordered
                  size="middle"
                  column={{ xs: 1, sm: 2, md: 2, lg: 3 }}
                  title={
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{user.name}</span>
                      <Tag color={statusColor(user.status)}>{String(user.status || "unknown").toUpperCase()}</Tag>
                      <Tag color="blue">ID: {user.user_id}</Tag>
                      {user.user_type ? <Tag>{user.user_type}</Tag> : null}
                    </div>
                  }
                >
                  <Descriptions.Item label="Email">{user.email || "—"}</Descriptions.Item>
                  <Descriptions.Item label="Phone">{user.phone || "—"}</Descriptions.Item>
                  <Descriptions.Item label="Company">{company || "—"}</Descriptions.Item>
                  <Descriptions.Item label="Company Tax ID">{user.companyTaxIdNumber || "—"}</Descriptions.Item>
                  <Descriptions.Item label="Country">{country || "—"}</Descriptions.Item>
                  <Descriptions.Item label="Address">{address || "—"}</Descriptions.Item>
                  <Descriptions.Item label="Member ID">{memberIdValue || "—"}</Descriptions.Item>
                  <Descriptions.Item label="User Login">{user.user_login || "—"}</Descriptions.Item>
                  <Descriptions.Item label="Registered At">{user.registered_at || "—"}</Descriptions.Item>
                  <Descriptions.Item label="Email Language">
                    <Tag color={currentLang === "zh-TW" ? "blue" : "default"}>
                      {currentLang === "zh-TW" ? "繁體中文" : "English"}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Timezone">{meta.timezone || "—"}</Descriptions.Item>
                  <Descriptions.Item label="Currency">{meta.currency || "—"}</Descriptions.Item>
                </Descriptions>

                {documentLinks.length > 0 && (
                  <div className="mt-6">
                    <Title level={5}>Documents</Title>
                    <div className="space-y-2">
                      {documentLinks.map((d) => (
                        <div key={d.label} className="flex flex-col gap-1">
                          <Text strong>{d.label}</Text>
                          <div className="flex flex-wrap gap-2">
                            {d.urls.map((u) => (
                              <a key={u} href={u} target="_blank" rel="noreferrer">{u}</a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        title={`Edit User — ${user?.name || ""}`}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={handleSave}
        okText="Save Changes"
        confirmLoading={saving}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item label="Display Name" name="firstName">
            <Input placeholder="Display name" />
          </Form.Item>

          <Form.Item label="Phone" name="phone">
            <Input placeholder="Phone number" />
          </Form.Item>

          <Form.Item label="Company" name="company">
            <Input placeholder="Company name" />
          </Form.Item>

          <Form.Item label="Email Language" name="language">
            <Select
              options={[
                { value: "en", label: "English" },
                { value: "zh-TW", label: "繁體中文 (Traditional Chinese)" },
              ]}
            />
          </Form.Item>

          <Form.Item label="Timezone" name="timezone">
            <Select>
              <Select.Option value="Asia/Taipei">台北 (GMT+8)</Select.Option>
              <Select.Option value="Asia/Hong_Kong">香港 (GMT+8)</Select.Option>
              <Select.Option value="Asia/Shanghai">上海 (GMT+8)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Currency" name="currency">
            <Select>
              <Select.Option value="TWD">TWD</Select.Option>
              <Select.Option value="USD">USD</Select.Option>
              <Select.Option value="HKD">HKD</Select.Option>
              <Select.Option value="CNY">CNY</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUserDetails;
