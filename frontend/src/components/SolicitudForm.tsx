import { useState, type FormEvent, type ReactElement } from "react";
import {
  Box,
  Button,
  Card,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { registrarSolicitud } from "@/api/derivacionApi";
import {
  TipoTramite,
  Prioridad,
  type Solicitud,
} from "@/types/derivacion";

interface SolicitudFormProps {
  readonly onSolicitudCreada: (solicitud: Solicitud) => void;
}

export function SolicitudForm({ onSolicitudCreada }: SolicitudFormProps): ReactElement {
  const [usuarioId, setUsuarioId] = useState("");
  const [tipoTramite, setTipoTramite] = useState<TipoTramite>("Tramite");
  const [prioridad, setPrioridad] = useState<Prioridad>("Normal");
  const [asunto, setAsunto] = useState("");
  const [detalle, setDetalle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validations
    if (!/^\d{8}$/.test(usuarioId.trim())) {
      toaster.create({
        type: "warning",
        title: "DNI Inválido",
        description: "El DNI debe contener exactamente 8 dígitos.",
      });
      return;
    }

    if (asunto.trim().length < 5 || asunto.trim().length > 200) {
      toaster.create({
        type: "warning",
        title: "Asunto Inválido",
        description: "El asunto debe tener entre 5 y 200 caracteres.",
      });
      return;
    }

    if (detalle.trim().length < 10 || detalle.trim().length > 2000) {
      toaster.create({
        type: "warning",
        title: "Detalle Inválido",
        description: "El detalle debe tener entre 10 y 2000 caracteres.",
      });
      return;
    }

    setLoading(true);
    try {
      const solicitud = await registrarSolicitud({
        usuario_id: usuarioId.trim(),
        tipo_tramite: tipoTramite,
        prioridad: prioridad,
        asunto: asunto.trim(),
        detalle_solicitud: detalle.trim(),
      });
      toaster.create({
        type: "success",
        title: "Solicitud Registrada",
        description: `Se registró exitosamente la solicitud con ID: ${solicitud.id}`,
      });
      onSolicitudCreada(solicitud);
    } catch (err: any) {
      toaster.create({
        type: "error",
        title: "Error al registrar",
        description: err.message || "No se pudo registrar la solicitud.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card.Root bg="gray.850" borderColor="gray.700" p={6} shadow="lg">
      <Stack gap={4}>
        <Heading size="md" color="blue.300">
          Registrar Nueva Solicitud
        </Heading>
        <Text fontSize="sm" color="gray.400">
          Ingrese los datos solicitados para generar su ticket de Mesa de Partes Electrónica.
        </Text>

        <form onSubmit={handleSubmit} noValidate>
          <Stack gap={5}>
            <Box>
              <Text mb={2} fontWeight="medium" fontSize="sm">DNI del Ciudadano</Text>
              <Input
                placeholder="Ingrese los 8 dígitos de su DNI"
                value={usuarioId}
                onChange={(e) => setUsuarioId(e.target.value.replace(/\D/g, "").slice(0, 8))}
                maxLength={8}
                disabled={loading}
              />
            </Box>

            <HStack gap={4} width="100%">
              <Box flex={1}>
                <Text mb={2} fontWeight="medium" fontSize="sm">Tipo de Trámite</Text>
                <NativeSelect.Root size="md" disabled={loading}>
                  <NativeSelect.Field
                    value={tipoTramite}
                    onChange={(e) => setTipoTramite(e.currentTarget.value as TipoTramite)}
                  >
                    <option value="Tramite">Trámite General</option>
                    <option value="Reclamo">Reclamo / Queja</option>
                    <option value="Consulta">Consulta Informativa</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Box>

              <Box flex={1}>
                <Text mb={2} fontWeight="medium" fontSize="sm">Prioridad del Trámite</Text>
                <NativeSelect.Root size="md" disabled={loading}>
                  <NativeSelect.Field
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.currentTarget.value as Prioridad)}
                  >
                    <option value="Normal">Normal (30 días hábiles)</option>
                    <option value="Urgente">Urgente (15 días calendarios)</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Box>
            </HStack>

            <Box>
              <Text mb={2} fontWeight="medium" fontSize="sm">Asunto / Título</Text>
              <Input
                placeholder="Resumen del trámite (ej: Solicitud de rectificación de DNI)"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                maxLength={200}
                disabled={loading}
              />
            </Box>

            <Box>
              <Text mb={2} fontWeight="medium" fontSize="sm">Detalle de la Solicitud</Text>
              <Textarea
                placeholder="Explique de manera clara y detallada su requerimiento..."
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
                maxLength={2000}
                rows={6}
                disabled={loading}
              />
            </Box>

            <Button
              type="submit"
              colorPalette="blue"
              loading={loading}
              loadingText="Registrando..."
              width="100%"
              mt={2}
            >
              Enviar Solicitud
            </Button>
          </Stack>
        </form>
      </Stack>
    </Card.Root>
  );
}
