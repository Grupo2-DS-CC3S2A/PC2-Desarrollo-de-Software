import {
  useEffect,
  useState,
  type ReactElement,
} from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Separator,
  Stack,
  Table,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";

import { toaster } from "@/components/ui/toaster";
import { useDerivacion } from "@/hooks/useDerivacion";
import {
  CATALOGO_DEPENDENCIAS,
  Dependencia,
  EstadoSolicitud,
  type Solicitud,
} from "@/types/derivacion";

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

export function AdminDerivacionPanel(): ReactElement {
  const {
    solicitudes,
    cargandoListado,
    enviandoDerivacion,
    errorListado,
    errorDerivacion,
    recargar,
    derivar,
    actualizarEstado,
  } = useDerivacion();

  const [adminToken, setAdminToken] = useState("RENIEC_ADMIN_SUPER_SECRET_2026");
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);

  // Campos para la derivación
  const [codigoDependencia, setCodigoDependencia] = useState<string>("");
  const [observacionesDerivacion, setObservacionesDerivacion] = useState<string>("");

  // Campos para el cambio de estado
  const [nuevoEstado, setNuevoEstado] = useState<EstadoSolicitud>("Pendiente");
  const [observacionesEstado, setObservacionesEstado] = useState<string>("");

  // Cargar solicitudes iniciales al montar o al cambiar el token
  useEffect(() => {
    if (adminToken.trim()) {
      void recargar(adminToken.trim());
    }
  }, [adminToken, recargar]);

  // Si se actualizó la lista y tenemos una solicitud seleccionada, actualizar su referencia
  useEffect(() => {
    if (selectedSolicitud) {
      const actualizada = solicitudes.find((s) => s.id === selectedSolicitud.id);
      if (actualizada) {
        setSelectedSolicitud(actualizada);
      }
    }
  }, [solicitudes, selectedSolicitud]);

  useEffect(() => {
    if (errorListado) {
      toaster.create({
        type: "error",
        title: "Error de listado",
        description: errorListado.message,
      });
    }
  }, [errorListado]);

  useEffect(() => {
    if (errorDerivacion) {
      toaster.create({
        type: "error",
        title: "Error en operación",
        description: errorDerivacion.message,
      });
    }
  }, [errorDerivacion]);

  const handleRecargar = (): void => {
    if (!adminToken.trim()) {
      toaster.create({
        type: "warning",
        title: "Token Requerido",
        description: "Debe ingresar el token de administrador.",
      });
      return;
    }
    void recargar(adminToken.trim());
  };

  const handleDerivar = async (): Promise<void> => {
    if (!selectedSolicitud) return;
    if (!codigoDependencia) {
      toaster.create({
        type: "warning",
        title: "Datos inválidos",
        description: "Debe seleccionar una dependencia destino.",
      });
      return;
    }

    const res = await derivar(
      selectedSolicitud.id,
      {
        dependencia_asignada: codigoDependencia as Dependencia,
        observaciones: observacionesDerivacion.trim(),
      },
      adminToken.trim()
    );

    if (res) {
      toaster.create({
        type: "success",
        title: "Derivación exitosa",
        description: `La solicitud fue derivada a ${codigoDependencia} con éxito.`,
      });
      setObservacionesDerivacion("");
      setCodigoDependencia("");
    }
  };

  const handleActualizarEstado = async (): Promise<void> => {
    if (!selectedSolicitud) return;

    const res = await actualizarEstado(
      selectedSolicitud.id,
      {
        estado: nuevoEstado,
        observaciones: observacionesEstado.trim(),
      },
      adminToken.trim()
    );

    if (res) {
      toaster.create({
        type: "success",
        title: "Estado actualizado",
        description: `El estado cambió a ${nuevoEstado} correctamente.`,
      });
      setObservacionesEstado("");
    }
  };

  return (
    <Card.Root bg="gray.850" borderColor="gray.700" p={6} shadow="xl">
      <Stack gap={6}>
        <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <Box>
            <Heading size="md" color="blue.300">
              Panel del Administrador - Mesa de Partes
            </Heading>
            <Text fontSize="sm" color="gray.400">
              Gestión, derivación y atención de solicitudes ciudadanas.
            </Text>
          </Box>
          <HStack gap={2} minW="300px">
            <Input
              type="password"
              placeholder="Token de Administrador"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              size="sm"
            />
            <Button
              onClick={handleRecargar}
              loading={cargandoListado}
              size="sm"
              colorPalette="blue"
            >
              Cargar
            </Button>
          </HStack>
        </HStack>

        <Separator borderColor="gray.700" />

        {/* Layout de dos columnas: Tabla a la izquierda, detalles/acciones a la derecha */}
        <Stack gap={6} direction={{ base: "column", lg: "row" }} align="stretch">
          
          {/* Listado de Solicitudes */}
          <Box flex={2} bg="gray.900" p={4} borderRadius="md" borderWidth="1px" borderColor="gray.800">
            <Heading size="xs" color="gray.300" mb={3}>
              Solicitudes Recibidas ({solicitudes.length})
            </Heading>

            {cargandoListado && solicitudes.length === 0 ? (
              <Text fontSize="sm" color="gray.500" py={10} textAlign="center">
                Cargando listado de solicitudes...
              </Text>
            ) : solicitudes.length === 0 ? (
              <Text fontSize="sm" color="gray.500" py={10} textAlign="center">
                No hay solicitudes en el sistema o el token es inválido.
              </Text>
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm" variant="line" colorPalette="blue">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader color="gray.400">ID / DNI</Table.ColumnHeader>
                      <Table.ColumnHeader color="gray.400">Asunto</Table.ColumnHeader>
                      <Table.ColumnHeader color="gray.400">Trámite</Table.ColumnHeader>
                      <Table.ColumnHeader color="gray.400">Prioridad</Table.ColumnHeader>
                      <Table.ColumnHeader color="gray.400">Área</Table.ColumnHeader>
                      <Table.ColumnHeader color="gray.400">Estado</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {solicitudes.map((s) => (
                      <Table.Row
                        key={s.id}
                        _hover={{ bg: "gray.800", cursor: "pointer" }}
                        onClick={() => {
                          setSelectedSolicitud(s);
                          setNuevoEstado(s.estado);
                        }}
                        bg={selectedSolicitud?.id === s.id ? "blue.950" : "transparent"}
                        borderColor={selectedSolicitud?.id === s.id ? "blue.700" : "gray.800"}
                      >
                        <Table.Cell>
                          <VStack align="start" gap={0}>
                            <Text fontFamily="monospace" fontSize="xx-small" maxW="80px" overflow="hidden" textOverflow="ellipsis">
                              {s.id}
                            </Text>
                            <Text fontSize="xs" fontWeight="semibold" color="gray.400">
                              DNI: {s.usuario_id}
                            </Text>
                          </VStack>
                        </Table.Cell>
                        <Table.Cell fontWeight="medium" fontSize="xs" maxW="150px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                          {s.asunto}
                        </Table.Cell>
                        <Table.Cell fontSize="xs">{s.tipo_tramite}</Table.Cell>
                        <Table.Cell>
                          <Badge colorPalette={s.prioridad === "Urgente" ? "red" : "blue"} size="xs">
                            {s.prioridad}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell fontSize="xs" color="blue.300">
                          {s.dependencia_asignada ?? "Sin derivar"}
                        </Table.Cell>
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
                            size="xs"
                          >
                            {s.estado}
                          </Badge>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Box>

          {/* Panel de Gestión del Item Seleccionado */}
          <Box flex={1} bg="gray.900" p={4} borderRadius="md" borderWidth="1px" borderColor="gray.800" minW="320px">
            {selectedSolicitud ? (
              <Stack gap={5}>
                <VStack align="start" gap={1}>
                  <Badge colorPalette={selectedSolicitud.prioridad === "Urgente" ? "red" : "blue"} variant="solid">
                    {selectedSolicitud.prioridad}
                  </Badge>
                  <Heading size="sm" color="gray.200">
                    Gestión de Solicitud
                  </Heading>
                  <Text fontSize="xx-small" fontFamily="monospace" color="gray.500">
                    ID: {selectedSolicitud.id}
                  </Text>
                </VStack>

                <Box borderTopWidth="1px" borderBottomWidth="1px" py={3} borderColor="gray.800">
                  <Text fontSize="xs" fontWeight="bold" color="gray.400">Detalles:</Text>
                  <Text fontSize="xs" color="gray.300" mt={1}>
                    <strong>DNI:</strong> {selectedSolicitud.usuario_id}
                  </Text>
                  <Text fontSize="xs" color="gray.300">
                    <strong>Fecha:</strong> {formatearFecha(selectedSolicitud.fecha_ingreso)}
                  </Text>
                  <Text fontSize="xs" color="yellow.400">
                    <strong>Límite:</strong> {formatearFecha(selectedSolicitud.fecha_maxima_respuesta)}
                  </Text>
                  <Text fontSize="xs" fontWeight="bold" color="gray.400" mt={2}>Asunto:</Text>
                  <Text fontSize="xs" color="gray.300">{selectedSolicitud.asunto}</Text>
                  <Text fontSize="xs" fontWeight="bold" color="gray.400" mt={2}>Detalle:</Text>
                  <Text fontSize="xs" color="gray.400" bg="gray.950" p={2} borderRadius="sm" mt={1} maxH="100px" overflowY="auto">
                    {selectedSolicitud.detalle_solicitud}
                  </Text>
                  {selectedSolicitud.observaciones && (
                    <>
                      <Text fontSize="xs" fontWeight="bold" color="yellow.500" mt={2}>Observaciones previas:</Text>
                      <Text fontSize="xs" color="yellow.300" bg="yellow.950" p={2} borderRadius="sm" mt={1}>
                        {selectedSolicitud.observaciones}
                      </Text>
                    </>
                  )}
                </Box>

                {/* Formulario 1: Derivar a Dependencia */}
                <Stack gap={3}>
                  <Text fontSize="xs" fontWeight="bold" color="blue.300">
                    1. Derivar a Dependencia
                  </Text>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      value={codigoDependencia}
                      onChange={(e) => setCodigoDependencia(e.target.value)}
                    >
                      <option value="">Seleccione una Dependencia</option>
                      {CATALOGO_DEPENDENCIAS.map((d) => (
                        <option key={d.codigo} value={d.codigo}>
                          {d.etiqueta} ({d.plazo_dias_habiles}d plazo)
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                  <Textarea
                    placeholder="Instrucciones para la derivación..."
                    value={observacionesDerivacion}
                    onChange={(e) => setObservacionesDerivacion(e.target.value)}
                    maxLength={500}
                    rows={2}
                    size="xs"
                  />
                  <Button
                    onClick={handleDerivar}
                    loading={enviandoDerivacion}
                    disabled={!codigoDependencia}
                    size="xs"
                    colorPalette="blue"
                  >
                    Derivar Solicitud
                  </Button>
                </Stack>

                <Separator borderColor="gray.800" />

                {/* Formulario 2: Actualizar Estado */}
                <Stack gap={3}>
                  <Text fontSize="xs" fontWeight="bold" color="green.300">
                    2. Cambiar Estado
                  </Text>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      value={nuevoEstado}
                      onChange={(e) => setNuevoEstado(e.target.value as EstadoSolicitud)}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En Proceso">En Proceso</option>
                      <option value="Atendida">Atendida</option>
                      <option value="Rechazada">Rechazada</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                  <Textarea
                    placeholder="Detalle o justificación de la resolución..."
                    value={observacionesEstado}
                    onChange={(e) => setObservacionesEstado(e.target.value)}
                    maxLength={500}
                    rows={2}
                    size="xs"
                  />
                  <Button
                    onClick={handleActualizarEstado}
                    loading={enviandoDerivacion}
                    size="xs"
                    colorPalette="green"
                  >
                    Actualizar Estado
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <VStack justify="center" align="center" h="100%" py={10} gap={2}>
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  Seleccione una solicitud de la lista para gestionarla.
                </Text>
              </VStack>
            )}
          </Box>
        </Stack>
      </Stack>
    </Card.Root>
  );
}
