import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Modal,
  Table,
  Button,
  Select,
  Input,
  Space,
  Alert,
  Tooltip,
  Tag,
  Typography,
} from "antd";
import {
  Filter,
  Plus,
  Trash2,
  RefreshCw,
  LocateFixed,
  AlertTriangle,
} from "lucide-react";
import layerApi from "../../api/LayerApi";
import { filterOperatorsForType, formatFilterPayload, extractApiError } from "../../utils/wfsUtils";
import { useLanguage } from "../../context/LanguageContext";

const { Text } = Typography;
const { Option } = Select;

const AttributeTableModal = ({
  layer,
  visible,
  onClose,
  onSelectFeature,
}) => {
  const { t } = useLanguage();

  // State schema & data
  const [schema, setSchema] = useState(null);
  const [columns, setColumns] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  // Loading & error
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const [schemaError, setSchemaError] = useState(null);
  const [hasNoPk, setHasNoPk] = useState(false);

  // Pagination & Sort
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [sorter, setSorter] = useState({ field: null, order: null });

  // Filter Builder state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterRows, setFilterRows] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState(null);

  const abortControllerRef = useRef(null);

  // 1. Fetch Schema saat modal dibuka atau layer berubah
  useEffect(() => {
    setSchema(null);
    setColumns([]);
    setVisibleColumns([]);
    setRows([]);
    setTotal(0);
    setSchemaError(null);
    setHasNoPk(false);
    setPagination({ current: 1, pageSize: 20 });
    setSorter({ field: null, order: null });
    setFilterRows([]);
    setAppliedFilters(null);

    if (!visible || !layer) {
      return;
    }

    const fetchSchema = async () => {
      setIsLoadingSchema(true);
      setSchemaError(null);
      setHasNoPk(false);

      try {
        const res = await layerApi.getLayerSchema(layer.id);
        const schemaData = res?.data || res;
        setSchema(schemaData);

        if (!schemaData.has_pk) {
          setHasNoPk(true);
          return;
        }

        // Siapkan kolom tabel (sembunyikan kolom PK/gid dan geometri dari tampilan default)
        const allCols = schemaData.columns || [];
        const tableCols = allCols
          .filter((c) => !c.is_pk && c.local_type !== "geometry" && c.name !== "geometry")
          .map((c) => ({
            title: c.name,
            dataIndex: [c.name],
            key: c.name,
            sorter: true,
            render: (text, record) => {
              const val = text !== undefined ? text : (record?.[c.name] ?? record?.properties?.[c.name]);
              if (val === null || val === undefined) {
                return <span className="text-slate-400 select-none font-sans font-medium">—</span>;
              }
              if (typeof val === "object") return JSON.stringify(val);
              return String(val);
            },
          }));

        setColumns(tableCols);
        setVisibleColumns(tableCols.map((c) => c.key));
      } catch (err) {
        if (err?.response?.status === 409) {
          setHasNoPk(true);
        } else {
          setSchemaError(extractApiError(err) || t('failedLoadSchema', 'Gagal memuat skema layer.'));
        }
      } finally {
        setIsLoadingSchema(false);
      }
    };

    fetchSchema();
  }, [visible, layer?.id, t]);

  // 2. Fetch Features Data
  const fetchFeatures = useCallback(async (page, pageSize, sortConfig, filters) => {
    if (!layer || !schema?.has_pk) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoadingRows(true);

    const payload = {
      page,
      page_size: pageSize,
    };

    if (sortConfig?.field && sortConfig?.order) {
      payload.sort = [{
        field: sortConfig.field,
        dir: sortConfig.order === "descend" ? "DESC" : "ASC",
      }];
    }

    if (filters && Array.isArray(filters) && filters.length > 0) {
      payload.filters = filters;
    }

    try {
      const res = await layerApi.queryLayerFeatures(layer.id, payload, abortControllerRef.current.signal);
      const rowsData = res?.rows || [];

      // Map rows with __fid and properties
      const mappedRows = rowsData.map((r, idx) => ({
        key: r.fid || idx,
        __fid: r.fid,
        ...(r.properties || {}),
      }));

      setRows(mappedRows);
      setTotal(res?.total ?? mappedRows.length);
    } catch (_err) {
      // Aborted or fetch error
    } finally {
      setIsLoadingRows(false);
    }
  }, [layer, schema]);

  // Trigger query saat pagination, sorter, atau appliedFilters berubah
  useEffect(() => {
    if (visible && layer && schema?.has_pk) {
      fetchFeatures(pagination.current, pagination.pageSize, sorter, appliedFilters);
    }
  }, [visible, layer, schema, pagination.current, pagination.pageSize, sorter, appliedFilters, fetchFeatures]);

  // Handle table change (pagination & sorting)
  const handleTableChange = (newPagination, filters, newSorter) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
    setSorter({
      field: newSorter.field || null,
      order: newSorter.order || null,
    });
  };

  // Filter builder actions
  const handleAddFilterRow = () => {
    const availableCols = schema?.columns?.filter((c) => !c.is_pk && c.local_type !== "geometry") || [];
    const firstCol = availableCols[0]?.name || "";
    const firstType = availableCols[0]?.local_type || "string";
    const ops = filterOperatorsForType(firstType);

    setFilterRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        column: firstCol,
        operator: ops[0] || "=",
        value: "",
      },
    ]);
  };

  const handleFilterRowChange = (id, field, val) => {
    setFilterRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: val };
        if (field === "column") {
          const colDef = schema?.columns?.find((c) => c.name === val);
          const ops = filterOperatorsForType(colDef?.local_type || "string");
          updated.operator = ops[0] || "=";
        }
        return updated;
      })
    );
  };

  const handleRemoveFilterRow = (id) => {
    setFilterRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleApplyFilters = () => {
    const formatted = formatFilterPayload(filterRows);
    setAppliedFilters(formatted);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleResetFilters = () => {
    setFilterRows([]);
    setAppliedFilters(null);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // Handle locate feature (fetch geometri lengkap via getFeatureById)
  const handleLocateRow = async (record) => {
    if (!record?.__fid || !layer) return;
    try {
      const full = await layerApi.getFeatureById(layer.id, record.__fid);
      if (full) {
        onSelectFeature?.(full);
        onClose();
      }
    } catch (_err) {
      // Locate failed
    }
  };

  // Kolom aksi 'Locate' di paling kiri
  const activeColumns = [
    {
      title: "",
      key: "__actions",
      width: 50,
      fixed: "left",
      render: (_, record) => (
        <Tooltip title={t('locateOnMap', 'Sorot di Peta')}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleLocateRow(record);
            }}
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition cursor-pointer"
          >
            <LocateFixed className="w-4 h-4" />
          </button>
        </Tooltip>
      ),
    },
    ...columns.filter((c) => visibleColumns.includes(c.key)),
  ];

  return (
    <Modal
      title={
        <div className="flex items-center justify-between pr-8">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              {t('attributeTableTitle', 'Tabel Atribut')}: {layer?.display_name || layer?.layer_name || layer?.store_name}
            </span>
            <Tag color="blue">{total} {t('features', 'Fitur')}</Tag>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={null}
      destroyOnClose
      destroyOnHidden
      centered
      styles={{ body: { padding: "12px 16px" } }}
    >
      {/* Peringatan 409 Belum punya PK */}
      {hasNoPk && (
        <Alert
          type="warning"
          showIcon
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          title={t('noPkWarningTitle', 'Layer Belum Memiliki Primary Key (gid)')}
          message={t('noPkWarningTitle', 'Layer Belum Memiliki Primary Key (gid)')}
          description={
            <div>
              <p>
                {t(
                  'noPkWarningDesc',
                  'Layer belum memiliki primary key (gid). Silakan hubungi admin atau jalankan migrasi scripts/add_gid_pk.py terlebih dahulu.'
                )}
              </p>
              <div className="mt-2 text-xs text-slate-500 font-mono bg-amber-100/50 p-2 rounded">
                python scripts/add_gid_pk.py --workspace {layer?.workspace_name}
              </div>
            </div>
          }
          className="mb-4"
        />
      )}

      {schemaError && (
        <Alert type="error" title={schemaError} message={schemaError} showIcon className="mb-4" />
      )}

      {!hasNoPk && (
        <div className="space-y-3">
          {/* Toolbar: Filter toggle & Refresh */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Space>
              <Button
                size="small"
                icon={<Filter className="w-3.5 h-3.5" />}
                type={appliedFilters ? "primary" : "default"}
                onClick={() => setIsFilterOpen((prev) => !prev)}
              >
                {t('filterBuilder', 'Filter CQL')} {appliedFilters ? "(Aktif)" : ""}
              </Button>

              <Button
                size="small"
                icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingRows ? "animate-spin" : ""}`} />}
                onClick={() => fetchFeatures(pagination.current, pagination.pageSize, sorter, appliedFilters)}
              >
                {t('refresh', 'Refresh')}
              </Button>
            </Space>

            {/* Kolom Visibilitas Selector */}
            <Select
              mode="multiple"
              size="small"
              maxTagCount="responsive"
              placeholder={t('selectColumns', 'Pilih Kolom')}
              value={visibleColumns}
              onChange={setVisibleColumns}
              style={{ minWidth: 200, maxWidth: 350 }}
            >
              {columns.map((c) => (
                <Option key={c.key} value={c.key}>
                  {c.title}
                </Option>
              ))}
            </Select>
          </div>

          {/* Panel Filter Builder */}
          {isFilterOpen && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <Text strong className="text-xs text-slate-600">
                  {t('filterConditions', 'Kondisi Filter (AND)')}
                </Text>
                <Button size="small" type="dashed" icon={<Plus className="w-3 h-3" />} onClick={handleAddFilterRow}>
                  {t('addCondition', 'Tambah Kondisi')}
                </Button>
              </div>

              {filterRows.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  {t('noFiltersConfigured', 'Belum ada filter. Klik "Tambah Kondisi" untuk menyaring fitur.')}
                </p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {filterRows.map((row) => {
                    const colDef = schema?.columns?.find((c) => c.name === row.column);
                    const ops = filterOperatorsForType(colDef?.local_type || "string");
                    const isNullOp = row.operator === "IS NULL" || row.operator === "IS NOT NULL";

                    return (
                      <div key={row.id} className="flex items-center gap-2">
                        <Select
                          size="small"
                          value={row.column}
                          onChange={(v) => handleFilterRowChange(row.id, "column", v)}
                          style={{ width: 160 }}
                        >
                          {schema?.columns
                            ?.filter((c) => !c.is_pk && c.local_type !== "geometry")
                            .map((c) => (
                              <Option key={c.name} value={c.name}>
                                {c.name}
                              </Option>
                            ))}
                        </Select>

                        <Select
                          size="small"
                          value={row.operator}
                          onChange={(v) => handleFilterRowChange(row.id, "operator", v)}
                          style={{ width: 110 }}
                        >
                          {ops.map((op) => (
                            <Option key={op} value={op}>
                              {op}
                            </Option>
                          ))}
                        </Select>

                        {!isNullOp && (
                          <Input
                            size="small"
                            placeholder={row.operator === "IN" ? "val1, val2" : "Nilai filter"}
                            value={row.value}
                            onChange={(e) => handleFilterRowChange(row.id, "value", e.target.value)}
                            style={{ flex: 1 }}
                          />
                        )}

                        <Button
                          size="small"
                          type="text"
                          danger
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          onClick={() => handleRemoveFilterRow(row.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <Button size="small" onClick={handleResetFilters}>
                  {t('reset', 'Reset')}
                </Button>
                <Button size="small" type="primary" onClick={handleApplyFilters}>
                  {t('applyFilter', 'Terapkan Filter')}
                </Button>
              </div>
            </div>
          )}

          {/* Tabel Data Atribut */}
          <Table
            columns={activeColumns}
            dataSource={rows}
            loading={isLoadingSchema || isLoadingRows}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              size: "small",
            }}
            onChange={handleTableChange}
            scroll={{ x: "max-content", y: 360 }}
            size="small"
            bordered
            onRow={(record) => ({
              onDoubleClick: () => handleLocateRow(record),
              className: "cursor-pointer hover:bg-blue-50/50",
            })}
          />
        </div>
      )}
    </Modal>
  );
};

export default AttributeTableModal;

