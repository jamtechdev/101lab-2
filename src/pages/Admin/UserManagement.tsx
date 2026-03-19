"use client";

import { useState, useEffect } from "react";
import { Table, Input, Switch, message, Select, Button, DatePicker, Tag, Tooltip, Avatar, Modal } from "antd";
import { SearchOutlined, ReloadOutlined, UserOutlined, FilterOutlined, TeamOutlined, CheckCircleOutlined, ClockCircleOutlined, DeleteOutlined, ExclamationCircleOutlined, DownloadOutlined } from "@ant-design/icons";
import { useGetUsersQuery, useLazyGetUsersQuery, useUpdateUserStatusMutation, useDeleteUsersMutation } from "@/rtk/slices/adminApiSlice";
import { exportToExcel } from "@/utils/exportToExcel";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { subscribeAdminEvents } from '@/socket/adminEvent'

const { RangePicker } = DatePicker;
const { confirm } = Modal;

const NA = "N/A";

const AdminUsersAntd = () => {
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | undefined>();
    const [userTypeFilter, setUserTypeFilter] = useState<string | undefined>();
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
    const [dateRange, setDateRange] = useState<[string, string] | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

    const { sidebarCollapsed } = useAdminSidebar();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const { data, isLoading, isFetching, refetch } = useGetUsersQuery({
        page,
        limit,
        search: searchText || undefined,
        status: statusFilter,
        userType: userTypeFilter,
        sort: sortOrder,
        startDate: dateRange ? dateRange[0] : undefined,
        endDate: dateRange ? dateRange[1] : undefined,
    });

    const [updateUserStatus, { isLoading: updatingStatus }] = useUpdateUserStatusMutation();
    const [deleteUsers, { isLoading: deleting }] = useDeleteUsersMutation();
    const [fetchAllUsers, { isLoading: exporting }] = useLazyGetUsersQuery();

    const handleExport = async () => {
        try {
            const result = await fetchAllUsers({ page: 1, limit: 9999 }).unwrap();
            const rows = (result?.data || []).map((u: any, i: number) => ({
                "#": i + 1,
                "Name": u.name || "",
                "Email": u.email || "",
                "User Type": u.user_type || "",
                "Company": u.company || "",
                "Phone": u.phone || "",
                "Status": u.status || "",
                "Registered": u.registered_at ? dayjs(u.registered_at).format("MMM D, YYYY") : "",
            }));
            exportToExcel(rows, "users");
        } catch {
            message.error("Export failed");
        }
    };

    const handleStatusToggle = async (userId: number, currentStatus: "approved" | "pending") => {
        const newStatus = currentStatus === "approved" ? "pending" : "approved";
        try {
            await updateUserStatus({ userId, status: newStatus }).unwrap();
            message.success(`User status updated to ${newStatus}`);
            refetch();
        } catch (err: any) {
            message.error(err?.data?.message || "Something went wrong");
        }
    };

    const handleDeleteSingle = (userId: number, name: string) => {
        confirm({
            title: `Delete user "${name}"?`,
            icon: <ExclamationCircleOutlined />,
            content: "This action cannot be undone. All user data will be permanently removed.",
            okText: "Delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    await deleteUsers({ userIds: [userId] }).unwrap();
                    message.success("User deleted successfully");
                    setSelectedRowKeys((prev) => prev.filter((id) => id !== userId));
                    refetch();
                } catch (err: any) {
                    message.error(err?.data?.message || "Delete failed");
                }
            },
        });
    };

    const handleDeleteBulk = () => {
        if (!selectedRowKeys.length) return;
        confirm({
            title: `Delete ${selectedRowKeys.length} selected user(s)?`,
            icon: <ExclamationCircleOutlined />,
            content: "This action cannot be undone. All selected users will be permanently removed.",
            okText: `Delete ${selectedRowKeys.length} users`,
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    await deleteUsers({ userIds: selectedRowKeys }).unwrap();
                    message.success(`${selectedRowKeys.length} user(s) deleted`);
                    setSelectedRowKeys([]);
                    refetch();
                } catch (err: any) {
                    message.error(err?.data?.message || "Delete failed");
                }
            },
        });
    };

    const cell = (val: string | null | undefined) => (val != null && String(val).trim() !== "" ? String(val) : NA);

    const totalUsers = data?.pagination?.total || 0;
    const approvedCount = data?.data?.filter((u: any) => u.status === "approved").length || 0;
    const pendingCount = data?.data?.filter((u: any) => u.status === "pending").length || 0;

    const columns = [
        {
            title: "#",
            key: "index",
            width: 52,
            render: (_: any, __: any, index: number) => (
                <span className="text-sm font-medium text-gray-400">{(page - 1) * limit + index + 1}</span>
            ),
        },
        {
            title: t("admin.users", "User"),
            dataIndex: "name",
            key: "name",
            render: (text: string, record: any) => (
                <div className="flex items-center gap-3 min-w-[180px]">
                    <Avatar
                        size={40}
                        icon={<UserOutlined />}
                        style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", flexShrink: 0 }}
                    >
                        {(text || "?").charAt(0).toUpperCase()}
                    </Avatar>
                    <div className="flex flex-col">
                        <span
                            onClick={() => navigate(`/admin/users/${record.user_id}`)}
                            className="font-semibold text-gray-800 hover:text-blue-600 transition-colors cursor-pointer leading-tight"
                        >
                            {cell(text)}
                        </span>
                        <span className="text-xs text-gray-400 mt-0.5">{cell(record.email)}</span>
                        <span className="text-xs text-gray-300">ID: {record.user_id}</span>
                    </div>
                </div>
            ),
        },
        {
            title: t("admin.userType", "Type"),
            key: "user_type",
            width: 90,
            render: (_: any, record: any) => (
                <Tag
                    color={record.user_type === "seller" ? "blue" : record.user_type === "buyer" ? "green" : "default"}
                    className="capitalize font-medium px-3 py-0.5 rounded-full"
                >
                    {cell(record.user_type)}
                </Tag>
            ),
        },
        {
            title: t("auth.companyName", "Company"),
            key: "company",
            render: (_: any, record: any) => (
                <div className="flex flex-col min-w-[120px]">
                    <span className="text-sm font-medium text-gray-700">{cell(record.company)}</span>
                    {record.phone && record.phone !== NA && (
                        <span className="text-xs text-gray-400 mt-0.5">{record.phone}</span>
                    )}
                </div>
            ),
        },
        {
            title: t("admin.registered", "Registered"),
            key: "registered_at",
            width: 110,
            render: (_: any, record: any) => (
                <span className="text-sm text-gray-500">
                    {record.registered_at ? dayjs(record.registered_at).format("MMM D, YYYY") : NA}
                </span>
            ),
        },
        {
            title: t("admin.common.status", "Status"),
            key: "status",
            width: 160,
            render: (_: any, record: any) => {
                const isApproved = record.status === "approved";
                return (
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={isApproved}
                            checkedChildren="On"
                            unCheckedChildren="Off"
                            onChange={() => handleStatusToggle(record.user_id, record.status)}
                            loading={updatingStatus}
                            style={{ background: isApproved ? "#22c55e" : undefined }}
                        />
                        <Tag
                            color={isApproved ? "success" : "warning"}
                            className="font-medium rounded-full px-2"
                        >
                            {isApproved
                                ? t("admin.usersPage.active", "Active")
                                : t("admin.usersPage.pendingReview", "Pending")}
                        </Tag>
                    </div>
                );
            },
        },
        {
            title: t("admin.common.actions", "Actions"),
            key: "actions",
            width: 140,
            render: (_: any, record: any) => (
                <div className="flex items-center gap-2">
                    <Button
                        type="primary"
                        size="small"
                        ghost
                        onClick={() => navigate(`/admin/users/${record.user_id}`)}
                        className="rounded-lg font-medium"
                    >
                        {t("admin.common.view", "View")}
                    </Button>
                    <Tooltip title="Delete user">
                        <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteSingle(record.user_id, record.name || record.email)}
                            className="rounded-lg"
                        />
                    </Tooltip>
                </div>
            ),
        },
    ];

    const handleResetFilters = () => {
        setSearchText("");
        setStatusFilter(undefined);
        setUserTypeFilter(undefined);
        setSortOrder("newest");
        setDateRange(null);
        setPage(1);
        refetch();
    };

    useEffect(() => {
        const unsub = subscribeAdminEvents(() => {
            refetch();
        });
        return unsub;
    }, []);

    useEffect(() => {
        setPage(1);
        const timeout = setTimeout(() => {
            refetch();
        }, 500);
        return () => clearTimeout(timeout);
    }, [searchText, statusFilter, userTypeFilter, sortOrder, dateRange]);

    return (
        <div className="min-h-screen w-full bg-gray-50">
            <AdminSidebar activePath="/admin/users" />
            <div className={sidebarCollapsed ? "lg:ml-16 transition-all duration-300" : "lg:ml-64 transition-all duration-300"}>
                <AdminHeader />

                <div className="p-6 mx-auto space-y-6">

                    {/* Page Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {t("admin.usersPage.title", "User Management")}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {t("admin.usersPage.subtitle", "Manage and monitor all registered users")}
                            </p>
                        </div>

                        {/* Summary Chips + Export */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
                                <TeamOutlined className="text-blue-500" />
                                <span className="text-sm font-semibold text-gray-700">{totalUsers} Total</span>
                            </div>
                            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
                                <CheckCircleOutlined className="text-green-500" />
                                <span className="text-sm font-semibold text-green-700">{approvedCount} Active</span>
                            </div>
                            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2">
                                <ClockCircleOutlined className="text-yellow-500" />
                                <span className="text-sm font-semibold text-yellow-700">{pendingCount} Pending</span>
                            </div>
                            <Button
                                icon={<DownloadOutlined />}
                                loading={exporting}
                                onClick={handleExport}
                                className="rounded-xl font-semibold border-green-300 text-green-700 hover:bg-green-50 hover:border-green-500"
                            >
                                Export Excel
                            </Button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <FilterOutlined className="text-blue-500" />
                            <span className="font-semibold text-gray-700 text-sm">
                                {t("admin.usersPage.filters", "Filters")}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                            <Input
                                placeholder={t("admin.usersPage.searchPlaceholder", "Search name, email...")}
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                prefix={<SearchOutlined className="text-gray-400" />}
                                allowClear
                                className="rounded-lg"
                                onPressEnter={() => setPage(1)}
                            />
                            <Select
                                placeholder={t("admin.usersPage.filterByStatus", "Filter by status")}
                                value={statusFilter}
                                onChange={(val) => setStatusFilter(val)}
                                allowClear
                                className="w-full"
                            >
                                <Select.Option value="approved">
                                    <Tag color="success">Approved</Tag>
                                </Select.Option>
                                <Select.Option value="pending">
                                    <Tag color="warning">Pending</Tag>
                                </Select.Option>
                            </Select>
                            <Select
                                placeholder={t("admin.usersPage.userTypePlaceholder", "User type")}
                                value={userTypeFilter}
                                onChange={(val) => setUserTypeFilter(val)}
                                allowClear
                                className="w-full"
                            >
                                <Select.Option value="seller">Seller</Select.Option>
                                <Select.Option value="buyer">Buyer</Select.Option>
                            </Select>
                            <Select
                                value={sortOrder}
                                onChange={(val) => setSortOrder(val)}
                                className="w-full"
                            >
                                <Select.Option value="newest">Newest first</Select.Option>
                                <Select.Option value="oldest">Oldest first</Select.Option>
                            </Select>
                            <div className="flex gap-2">
                                <RangePicker
                                    value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
                                    onChange={(dates) => {
                                        if (!dates) return setDateRange(null);
                                        setDateRange([dates[0].startOf("day").toISOString(), dates[1].endOf("day").toISOString()]);
                                    }}
                                    className="rounded-lg flex-1"
                                />
                                <Tooltip title="Reset filters">
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={handleResetFilters}
                                        className="rounded-lg"
                                    />
                                </Tooltip>
                            </div>
                        </div>
                    </div>

                    {/* Bulk action bar */}
                    {selectedRowKeys.length > 0 && (
                        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-5 py-3">
                            <span className="text-sm font-semibold text-red-700">
                                {selectedRowKeys.length} user(s) selected
                            </span>
                            <Button
                                danger
                                type="primary"
                                icon={<DeleteOutlined />}
                                loading={deleting}
                                onClick={handleDeleteBulk}
                                className="rounded-lg"
                            >
                                Delete Selected
                            </Button>
                        </div>
                    )}

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <Table
                            columns={columns}
                            dataSource={data?.data}
                            rowKey="user_id"
                            loading={isLoading || isFetching}
                            rowSelection={{
                                selectedRowKeys,
                                onChange: (keys) => setSelectedRowKeys(keys as number[]),
                                preserveSelectedRowKeys: true,
                            }}
                            pagination={{
                                current: page,
                                pageSize: limit,
                                total: data?.pagination?.total,
                                onChange: (p, pageSize) => {
                                    setPage(p);
                                    setLimit(pageSize);
                                },
                                showSizeChanger: true,
                                pageSizeOptions: ["10", "20", "50", "100"],
                                showTotal: (total, range) => (
                                    <span className="text-gray-500 text-sm">
                                        {range[0]}–{range[1]} of {total} users
                                    </span>
                                ),
                                className: "px-4 py-3",
                            }}
                            className="overflow-x-auto"
                            rowClassName="hover:bg-blue-50/40 transition-colors"
                        />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminUsersAntd;
