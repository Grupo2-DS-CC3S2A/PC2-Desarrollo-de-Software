import { useState, type ReactElement } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Heading,
  HStack,
  Input,
  Separator,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { obtenerSolicitud, listarSolicitudesUsuario } from "@/api/derivacionApi";
import type { Solicitud } from "@/types/derivacion";

function formatearFecha(isoString: string): string {
  try {
    const fecha = new Date(isoString);
    return fecha.toLocaleDateString("es-PE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export function SolicitudLookup(): ReactElement {
  const [searchId, setSearchId] = useState("");
  const [searchDni, setSearchDni] = useState("");
  const [solicitudUnica, setSolicitudUnica] = useState<Solicitud | null>(null);
  const [solicitudesLista, setSolicitudesLista] = useState<readonly Solicitud[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBuscarPorId = async () => {
    const cleanId = searchId.trim();
    if (!cleanId) {
      toaster.create({
        type: "warning",
        title: "Búsqueda vacía",
        description: "Ingrese un ID de solicitud válido.",
      });
      return;
    }

    setLoading(true);
    setSolicitudUnica(null);
    setSolicitudesLista(null);
    try {
      const res = await obtenerSolicitud(cleanId);
      setSolicitudUnica(res);
      toaster.create({
        type: "success",
        title: "Búsqueda exitosa",
        description: "Se encontró la solicitud solicitada.",
      });
    } catch (err: any) {
      toaster.create({
        type: "error",
        title: "Solicitud no encontrada",
        description: err.message || "No existe una solicitud con ese código.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBuscarPorDni = async () => {
    const cleanDni = searchDni.trim();
    if (!/^\d{8}$/.test(cleanDni)) {
      toaster.create({
        type: "warning",
        title: "DNI inválido",
        description: "El DNI debe tener exactamente 8 dígitos.",
      });
      return;
    }

    setLoading(true);
    setSolicitudUnica(null);
    setSolicitudesLista(null);
    try {
      const res = await listarSolicitudesUsuario(cleanDni);
      setSolicitudesLista(res);
      if (res.length === 0) {
        toaster.create({
          type: "info",
          title: "Sin resultados",
          description: "No se encontraron trámites registrados para este DNI.",
        });
      } else {
        toaster.create({
          type: "success",
          title: "Búsqueda exitosa",
          description: `Se encontraron ${res.length} solicitudes.`,
        });
      }
    } catch (err: any) {
      toaster.create({
        type: "error",
        title: "Error en búsqueda",
        description: err.message || "Ocurrió un error al buscar por DNI.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap={6}>
      <Card.Root bg="gray.850" borderColor="gray.700" p={6} shadow="lg">
        <Heading size="md" color="blue.300" mb={4}>
          Consulta de Estado de Solicitudes
        </Heading>
        <Text fontSize="sm" color="gray.400" mb={6}>
          Busque el estado de su requerimiento ingresando el código único de seguimiento o el DNI del solicitante.
        </Text>

        <Stack gap={6} md={{ direction: "row" }} justify="space-between">
          <Box flex={1} bg="gray.900" p={4} borderRadius="md" borderWidth="1px" borderColor="gray.800">
            <Text fontWeight="semibold" fontSize="sm" color="gray.300" mb={2}>
              Buscar por Código de Solicitud
            </Text>
            <HStack gap={2}>
              <Input
                placeholder="Código de ticket (UUID de 32 caracteres)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                disabled={loading}
              />
              <Button onClick={handleBuscarPorId} loading={loading} colorPalette="blue">
                Buscar
              </Button>
            </HStack>
          </Box>

          <Box flex={1} bg="gray.900" p={4} borderRadius="md" borderWidth="1px" borderColor="gray.800">
            <Text fontWeight="semibold" fontSize="sm" color="gray.300" mb={2}>
              Buscar por DNI del Ciudadano
            </Text>
            <HStack gap={2}>
              <Input
                placeholder="DNI del solicitante (8 dígitos)"
                value={searchDni}
                onChange={(e) => setSearchDni(e.target.value.replace(/\D/g, "").slice(0, 8))}
                maxLength={8}
                disabled={loading}
              />
              <Button onClick={handleBuscarPorDni} loading={loading} colorPalette="blue">
                Buscar
              </Button>
            </HStack>
          </Box>
        </Stack>
      </Card.Root>

      {/* Resultado de búsqueda único */}
      {solicitudUnica && (
        <Card.Root bg="gray.850" borderColor="blue.700" borderWidth="1px" p={6}>
          <Stack gap={4}>
            <Heading size="sm" color="blue.200">
              Detalle de Solicitud #{solicitudUnica.id}
            </Heading>
            <Separator borderColor="gray.700" />

            <Stack gap={3}>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.400">DNI Ciudadano:</Text>
                <Text fontWeight="medium">{solicitudUnica.usuario_id}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.400">Tipo Trámite / Prioridad:</Text>
                <Text fontWeight="medium">{solicitudUnica.tipo_tramite} ({solicitudUnica.prioridad})</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.400">Estado Actual:</Text>
                <Badge
                  colorPalette={
                    solicitudUnica.estado === "Atendida"
                      ? "green"
                      : solicitudUnica.estado === "Rechazada"
                        ? "red"
                        : solicitudUnica.estado === "En Proceso"
                          ? "blue"
                          : "yellow"
                  }
                >
                  {solicitudUnica.estado}
                </Badge>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.400">Área Asignada:</Text>
                <Text fontWeight="semibold" color="blue.300">
                  {solicitudUnica.dependencia_asignada ?? "Pendiente de derivar"}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.400">Fecha de Ingreso:</Text>
                <Text fontSize="sm">{formatearFecha(solicitudUnica.fecha_ingreso)}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.400">Fecha Límite Respuesta:</Text>
                <Text fontSize="sm" fontWeight="medium" color="yellow.400">
                  {formatearFecha(solicitudUnica.fecha_maxima_respuesta)}
                </Text>
              </HStack>
              <Box>
                <Text fontSize="sm" color="gray.400" mb={1}>Asunto:</Text>
                <Text fontWeight="semibold" color="gray.200">{solicitudUnica.asunto}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.400" mb={1}>Detalle de la Petición:</Text>
                <Text fontSize="sm" bg="gray.900" p={3} borderRadius="md" color="gray.300">
                  {solicitudUnica.detalle_solicitud}
                </Text>
              </Box>
              {solicitudUnica.observaciones && (
                <Box>
                  <Text fontSize="sm" color="yellow.400" fontWeight="bold" mb={1}>
                    Observaciones de la Dependencia:
                  </Text>
                  <Text fontSize="sm" bg="yellow.950" borderColor="yellow.700" borderWidth="1px" p={3} borderRadius="md" color="yellow.200">
                    {solicitudUnica.observaciones}
                  </Text>
                </Box>
              )}
            </Stack>
          </Stack>
        </Card.Root>
      )}

      {/* Resultados de búsqueda múltiples (por DNI) */}
      {solicitudesLista && (
        <Card.Root bg="gray.850" borderColor="blue.700" borderWidth="1px" p={6}>
          <Heading size="sm" color="blue.200" mb={4}>
            Trámites Relacionados al Ciudadano ({solicitudesLista.length})
          </Heading>
          {solicitudesLista.length === 0 ? (
            <Text color="gray.500" fontSize="sm">No hay trámites registrados.</Text>
          ) : (
            <Box overflowX="auto">
              <Table.Root size="sm" variant="line" colorPalette="blue">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader color="gray.300">Código</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.300">Asunto</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.300">Prioridad</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.300">Área Asignada</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.300">Estado</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.300">Fecha Ingreso</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {solicitudesLista.map((s) => (
                    <Table.Row
                      key={s.id}
                      _hover={{ bg: "gray.800", cursor: "pointer" }}
                      onClick={() => setSolicitudUnica(s)}
                    >
                      <Table.Cell fontFamily="monospace" fontSize="xs" maxW="120px" overflow="hidden" textOverflow="ellipsis">
                        {s.id}
                      </Table.Cell>
                      <Table.Cell fontWeight="medium">{s.asunto}</Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette={s.prioridad === "Urgente" ? "red" : "blue"}>
                          {s.prioridad}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>{s.dependencia_asignada ?? "Sin derivar"}</Table.Cell>
                      <Table.Cell>
                        <Badge
                          colorPalette={
                            s.estado === "Atendida"
                              ? "green"
                              : s.estado === "Rechazada"
                                ? "red"
                                : s.estado === "En Proceso"
                                  ? "blue"
                                  : "yellow"
                          }
                        >
                          {s.estado}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell fontSize="xs">{formatearFecha(s.fecha_ingreso)}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
              <Text fontSize="xs" color="gray.500" mt={3}>
                * Haga clic en una fila para visualizar el detalle completo y observaciones de esa solicitud.
              </Text>
            </Box>
          )}
        </Card.Root>
      )}
    </Stack>
  );
}
