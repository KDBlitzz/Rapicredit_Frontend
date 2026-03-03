"use client";

import React from "react";
import { useParams } from "next/navigation";
import {
	Box,
	Paper,
	Typography,
	CircularProgress,
	Grid,
	Divider,
	Alert,
	Button,
} from "@mui/material";
import Link from "next/link";
import { usePrestamoDetalle } from "../../../../hooks/usePrestamoDetalle";
import { usePermisos } from "../../../../hooks/usePermisos";

const PrestamoDocumentosPage: React.FC = () => {
	const params = useParams();
	const codigoPrestamo = params?.id as string;

	const { empleado, loading: loadingPermisos } = usePermisos();
	const rolActual = (empleado?.rol || "").toLowerCase();
	const isGerente = rolActual === "gerente";

	const { data, loading, error } = usePrestamoDetalle(codigoPrestamo, 0);

	const formatMoney = (v?: number) =>
		v != null
			? `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
			: "L. 0.00";

	const formatDate = (iso?: string) =>
		iso ? new Date(iso).toLocaleDateString("es-HN") : "-";

	if (loadingPermisos || (loading && !data)) {
		return (
			<Box sx={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
				<CircularProgress size={28} />
			</Box>
		);
	}

	if (!isGerente) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="warning" sx={{ mb: 2 }}>
					Solo el Gerente puede visualizar el contrato y el pagaré de los préstamos.
				</Alert>
				<Button component={Link} href={codigoPrestamo ? `/prestamos/${encodeURIComponent(codigoPrestamo)}` : "/prestamos"} variant="outlined">
					Volver al préstamo
				</Button>
			</Box>
		);
	}

	if (error) {
		return (
			<Box sx={{ p: 3 }}>
				<Typography color="error" variant="body2">{error}</Typography>
			</Box>
		);
	}

	if (!data) {
		return (
			<Box sx={{ p: 3 }}>
				<Typography variant="body2">No se pudo cargar la información del préstamo.</Typography>
			</Box>
		);
	}

	const estado = (data.estadoPrestamo || "").toUpperCase();

	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
			<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 1 }}>
				<Box>
					<Typography variant="h6">Contrato y pagaré del préstamo {data.codigoPrestamo}</Typography>
					<Typography variant="body2" color="text.secondary">
						Cliente: {data.cliente?.nombreCompleto || data.cliente?.codigoCliente || data.cliente?.identidadCliente || "—"}
					</Typography>
					<Typography variant="caption" color="text.secondary">
						Estado del préstamo: {estado}
					</Typography>
				</Box>

				<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
					<Button size="small" variant="outlined" component={Link} href={`/prestamos/${encodeURIComponent(data.codigoPrestamo)}`}>
						Volver al préstamo
					</Button>
				</Box>
			</Box>

			<Paper sx={{ p: 3 }}>
				<Typography variant="subtitle1" sx={{ mb: 2 }}>
					Datos del contrato
				</Typography>
				<Grid container spacing={2}>
					<Grid size={{ xs: 12, sm: 6 }}>
						<Typography variant="caption" color="text.secondary">
							Cliente
						</Typography>
						<Typography variant="body2">
							{data.cliente?.nombreCompleto || data.cliente?.codigoCliente || data.cliente?.identidadCliente || "—"}
						</Typography>
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<Typography variant="caption" color="text.secondary">
							Capital
						</Typography>
						<Typography variant="body2">{formatMoney(data.capitalSolicitado)}</Typography>
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<Typography variant="caption" color="text.secondary">
							Plazo (cuotas)
						</Typography>
						<Typography variant="body2">{data.plazoCuotas}</Typography>
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<Typography variant="caption" color="text.secondary">
							Tasa de interés
						</Typography>
						<Typography variant="body2">
							{data.tasaInteresNombre || data.tasaInteresId || "—"}
						</Typography>
					</Grid>
				</Grid>

				<Divider sx={{ my: 3 }} />

				<Alert severity="info" sx={{ mb: 2 }}>
					Al presionar el botón se generará el PDF del contrato y el pagaré utilizando estos datos.
				</Alert>

				<Button
					variant="contained"
					color="primary"
					onClick={() => alert("Generar PDF (funcionalidad por implementar)")}
				>
					Generar PDF
				</Button>
			</Paper>
		</Box>
	);
};

export default PrestamoDocumentosPage;

