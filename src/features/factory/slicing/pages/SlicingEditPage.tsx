import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { Pencil, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { getCompactFieldSx } from "../../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { ErpDatePickerField } from "../../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { editSlicingDoneApi, fetchSlicingDoneById } from "../api/slicingApi";
import {
  highlightedRecordFormPrimaryButtonSx,
  recordFormActionButtonSx,
} from "../../../shared/buttonStyles";
import {
  formInlineActionButtonSx,
  formSectionCardSx,
  FormSectionHeader,
} from "../../../shared/formSectionStyles";
import {
  transactionTableBodyCellSx,
  transactionTableHeaderCellSx,
} from "../../../shared/listingTableStyles";
import { FactoryPageShell } from "../../shared/FactoryPageShell";

interface OutputEditRow {
  id: string;
  logCode: string;
  bundleNumber: string;
  palletNo: string;
  length: number;
  width: number;
  thickness: number;
  noOfLeaves: number;
  sqm: number;
  sqf: number;
  totalSqMeter: number;
  cbm: number;
  cbf: number;
  remark: string;
}

export function SlicingEditPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [slicingDate, setSlicingDate] = useState<Date | null>(new Date());
  const [remark, setRemark] = useState("");
  const [outputs, setOutputs] = useState<OutputEditRow[]>([]);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  // Line item editing fields
  const [editLogCode, setEditLogCode] = useState("");
  const [editBundleNumber, setEditBundleNumber] = useState("");
  const [editPalletNo, setEditPalletNo] = useState("");
  const [editLength, setEditLength] = useState("");
  const [editWidth, setEditWidth] = useState("");
  const [editThickness, setEditThickness] = useState("");
  const [editLeaves, setEditLeaves] = useState("");
  const [editRemark, setEditRemark] = useState("");

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage("");

    fetchSlicingDoneById(id)
      .then((data: any) => {
        if (data.slicingDate) {
          const parsed = new Date(data.slicingDate);
          if (!isNaN(parsed.getTime())) setSlicingDate(parsed);
        }
        setRemark(data.remark || "");
        setOutputs([
          {
            id: data.id,
            logCode: data.logCode || "",
            bundleNumber: data.bundleNumber || "",
            palletNo: data.palletNo || "",
            length: data.length || 0,
            width: data.width || 0,
            thickness: data.thickness || 0,
            noOfLeaves: data.noOfLeaves || 0,
            sqm: data.sqm || 0,
            sqf: data.sqf || 0,
            totalSqMeter: data.totalSqMeter || 0,
            cbm: data.cbm || 0,
            cbf: data.cbf || 0,
            remark: data.remark || "",
          },
        ]);
      })
      .catch((err) => {
        setErrorMessage(err.message || "Failed to load Slicing Done record");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  const handleStartEdit = (row: OutputEditRow) => {
    setEditingRowId(row.id);
    setEditLogCode(row.logCode);
    setEditBundleNumber(row.bundleNumber);
    setEditPalletNo(row.palletNo);
    setEditLength(String(row.length || ""));
    setEditWidth(String(row.width || ""));
    setEditThickness(String(row.thickness || ""));
    setEditLeaves(String(row.noOfLeaves || ""));
    setEditRemark(row.remark);
  };

  const handleSaveRow = () => {
    if (!editingRowId) return;
    const l = Number(editLength) || 0;
    const w = Number(editWidth) || 0;
    const th = Number(editThickness) || 0;
    const leaves = Number(editLeaves) || 0;

    const lMeters = l > 50 ? l / 1000 : l;
    const wMeters = w > 50 ? w / 1000 : w;
    const sqm = +(lMeters * wMeters * leaves).toFixed(4);
    const sqf = +(sqm * 10.7639).toFixed(4);

    setOutputs((prev) =>
      prev.map((r) =>
        r.id === editingRowId
          ? {
              ...r,
              logCode: editLogCode,
              bundleNumber: editBundleNumber,
              palletNo: editPalletNo,
              length: l,
              width: w,
              thickness: th,
              noOfLeaves: leaves,
              sqm,
              sqf,
              totalSqMeter: sqm,
              remark: editRemark,
            }
          : r
      )
    );
    setEditingRowId(null);
  };

  const handleSubmit = async () => {
    if (!id) return;
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await editSlicingDoneApi(id, {
        slicingDate: slicingDate ? slicingDate.toISOString().slice(0, 10) : undefined,
        remark,
        outputs: outputs.map((out) => ({
          id: out.id,
          logCode: out.logCode,
          bundleNumber: out.bundleNumber,
          palletNo: out.palletNo,
          length: out.length,
          width: out.width,
          thickness: out.thickness,
          noOfLeaves: out.noOfLeaves,
          sqm: out.sqm,
          sqf: out.sqf,
          totalSqMeter: out.totalSqMeter,
          remark: out.remark,
        })),
      });

      setSuccessMessage("Slicing Done record updated successfully");
      setTimeout(() => {
        navigate("/factory/slicing?tab=done");
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update Slicing Done record");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FactoryPageShell
      breadcrumbs={[
        { label: "Factory" },
        { label: "Slicing", to: "/factory/slicing" },
        { label: "Edit Slicing" },
      ]}
      subtitle="Modify Slicing Done output line items and remarks."
      title="Edit Slicing"
    >
      <Stack spacing={3}>
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        {successMessage && <Alert severity="success">{successMessage}</Alert>}

        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader title="Process Details" />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Box sx={{ width: 240 }}>
                <Typography
                  sx={{
                    mb: 0.5,
                    fontSize: 12,
                    fontWeight: 600,
                    color: theme.palette.text.secondary,
                  }}
                  variant="caption"
                >
                  Slicing Date
                </Typography>
                <ErpDatePickerField
                  onChange={setSlicingDate}
                  value={slicingDate}
                />
              </Box>
              <TextField
                fullWidth
                label="Process Remark"
                onChange={(e) => setRemark(e.target.value)}
                size="small"
                sx={(t) => getCompactFieldSx(t)}
                value={remark}
              />
            </Stack>
          </Stack>
        </Box>

        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader title="Output Details" />
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={transactionTableHeaderCellSx}>Log Code</TableCell>
                  <TableCell sx={transactionTableHeaderCellSx}>Bundle Number</TableCell>
                  <TableCell sx={transactionTableHeaderCellSx}>Pallet No</TableCell>
                  <TableCell sx={transactionTableHeaderCellSx}>Length</TableCell>
                  <TableCell sx={transactionTableHeaderCellSx}>Width</TableCell>
                  <TableCell sx={transactionTableHeaderCellSx}>Thickness</TableCell>
                  <TableCell sx={transactionTableHeaderCellSx}>Leaves</TableCell>
                  <TableCell sx={transactionTableHeaderCellSx}>SQM</TableCell>
                  <TableCell sx={transactionTableHeaderCellSx}>SQF</TableCell>
                  <TableCell sx={transactionTableHeaderCellSx}>Remark</TableCell>
                  <TableCell align="center" sx={transactionTableHeaderCellSx}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {outputs.map((row) => {
                  const isEditing = editingRowId === row.id;
                  if (isEditing) {
                    return (
                      <TableRow key={row.id}>
                        <TableCell sx={transactionTableBodyCellSx}>
                          <TextField
                            onChange={(e) => setEditLogCode(e.target.value)}
                            size="small"
                            value={editLogCode}
                          />
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx}>
                          <TextField
                            onChange={(e) => setEditBundleNumber(e.target.value)}
                            size="small"
                            value={editBundleNumber}
                          />
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx}>
                          <TextField
                            onChange={(e) => setEditPalletNo(e.target.value)}
                            size="small"
                            value={editPalletNo}
                          />
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx}>
                          <TextField
                            onChange={(e) => setEditLength(e.target.value)}
                            size="small"
                            value={editLength}
                          />
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx}>
                          <TextField
                            onChange={(e) => setEditWidth(e.target.value)}
                            size="small"
                            value={editWidth}
                          />
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx}>
                          <TextField
                            onChange={(e) => setEditThickness(e.target.value)}
                            size="small"
                            value={editThickness}
                          />
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx}>
                          <TextField
                            onChange={(e) => setEditLeaves(e.target.value)}
                            size="small"
                            value={editLeaves}
                          />
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx}>{row.sqm}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx}>{row.sqf}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx}>
                          <TextField
                            onChange={(e) => setEditRemark(e.target.value)}
                            size="small"
                            value={editRemark}
                          />
                        </TableCell>
                        <TableCell align="center" sx={transactionTableBodyCellSx}>
                          <IconButton
                            color="primary"
                            onClick={handleSaveRow}
                            size="small"
                          >
                            <Save size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return (
                    <TableRow key={row.id}>
                      <TableCell sx={transactionTableBodyCellSx}>{row.logCode || "-"}</TableCell>
                      <TableCell sx={transactionTableBodyCellSx}>{row.bundleNumber || "-"}</TableCell>
                      <TableCell sx={transactionTableBodyCellSx}>{row.palletNo || "-"}</TableCell>
                      <TableCell sx={transactionTableBodyCellSx}>{row.length}</TableCell>
                      <TableCell sx={transactionTableBodyCellSx}>{row.width}</TableCell>
                      <TableCell sx={transactionTableBodyCellSx}>{row.thickness}</TableCell>
                      <TableCell sx={transactionTableBodyCellSx}>{row.noOfLeaves}</TableCell>
                      <TableCell sx={transactionTableBodyCellSx}>{row.sqm}</TableCell>
                      <TableCell sx={transactionTableBodyCellSx}>{row.sqf}</TableCell>
                      <TableCell sx={transactionTableBodyCellSx}>{row.remark || "-"}</TableCell>
                      <TableCell align="center" sx={transactionTableBodyCellSx}>
                        <IconButton
                          onClick={() => handleStartEdit(row)}
                          size="small"
                          sx={(t) => formInlineActionButtonSx(t)}
                        >
                          <Pencil size={15} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Stack>
        </Box>

        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button
            onClick={() => navigate("/factory/slicing?tab=done")}
            sx={recordFormActionButtonSx}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            disabled={isSubmitting || isLoading}
            onClick={handleSubmit}
            sx={highlightedRecordFormPrimaryButtonSx}
            variant="contained"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </Stack>
      </Stack>
    </FactoryPageShell>
  );
}

