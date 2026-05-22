import type { ReactElement } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Heading,
  HStack,
  Separator,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import type { Solicitud } from "@/types/derivacion";

interface SolicitudReceiptProps {
  readonly solicitud: Solicitud;
  readonly onRegresar: () => void;
}

function formatearFecha(isoString: string): string {
  try {
    const fecha = new Date(isoString);
    return fecha.toLocaleString("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return isoString;
  }
}

export function SolicitudReceipt({ solicitud, onRegresar }: SolicitudReceiptProps): ReactElement {
  return (
    <Card.Root bg="gray.850" borderColor="green.700" borderWidth="2px" p={6} shadow="2xl">
      <Stack gap={6}>
        <VStack align="center" gap={1} textAlign="center">
          <Badge colorPalette="green" variant="solid" px={3} py={1} borderRadius="full" mb={2}>
            REGISTRO EXITOSO
          </Badge>
          <Heading size="md" color="green.300">
            Constancia de Presentación de Solicitud
          </Heading>
          <Text fontSize="xs" color="gray.400">
            Mesa de Partes Virtual - RENIEC
          </Text>
        </VStack>

        <Separator borderColor="gray.700" />

        <Stack gap={4}>
          <Box bg="gray.900" p={4} borderRadius="md" borderWidth="1px" borderColor="gray.800">
            <Text fontSize="xs" color="gray.500" fontWeight="bold">TICKET ID / CÓDIGO DE SEGUIMIENTO</Text>
            <Text fontSize="lg" fontWeight="extrabold" color="blue.300" fontFamily="monospace">
              {solicitud.id}
            </Text>
          </Box>

          <HStack justify="space-between">
            <Box>
              <Text fontSize="xs" color="gray.500">DNI CIUDADANO</Text>
              <Text fontWeight="semibold">{solicitud.usuario_id}</Text>
            </Box>
            <Box textAlign="right">
              <Text fontSize="xs" color="gray.500">TIPO DE TRÁMITE</Text>
              <Text fontWeight="semibold">{solicitud.tipo_tramite}</Text>
            </Box>
          </HStack>

          <HStack justify="space-between">
            <Box>
              <Text fontSize="xs" color="gray.500">PRIORIDAD</Text>
              <Badge colorPalette={solicitud.prioridad === "Urgente" ? "red" : "blue"}>
                {solicitud.prioridad}
              </Badge>
            </Box>
            <Box textAlign="right">
              <Text fontSize="xs" color="gray.500">ESTADO INICIAL</Text>
              <Badge colorPalette="yellow">{solicitud.estado}</Badge>
            </Box>
          </HStack>

          <Box>
            <Text fontSize="xs" color="gray.500">ASUNTO</Text>
            <Text fontWeight="semibold" color="gray.200">{solicitud.asunto}</Text>
          </Box>

          <Box>
            <Text fontSize="xs" color="gray.500">DETALLE PRESENTADO</Text>
            <Text fontSize="sm" color="gray.300" whiteSpace="pre-wrap" bg="gray.900" p={3} borderRadius="md">
              {solicitud.detalle_solicitud}
            </Text>
          </Box>

          <HStack justify="space-between">
            <Box>
              <Text fontSize="xs" color="gray.500">FECHA Y HORA DE INGRESO</Text>
              <Text fontSize="xs" fontWeight="medium">{formatearFecha(solicitud.fecha_ingreso)}</Text>
            </Box>
            <Box textAlign="right">
              <Text fontSize="xs" color="gray.500">FECHA LÍMITE DE RESPUESTA</Text>
              <Text fontSize="xs" fontWeight="semibold" color="yellow.400">
                {formatearFecha(solicitud.fecha_maxima_respuesta)}
              </Text>
            </Box>
          </HStack>

          {solicitud.dependencia_asignada && (
            <Box>
              <Text fontSize="xs" color="gray.500">ÁREA ASIGNADA</Text>
              <Text fontWeight="semibold" color="blue.200">{solicitud.dependencia_asignada}</Text>
            </Box>
          )}
        </Stack>

        <Separator borderColor="gray.700" />

        <Box textAlign="center" pt={2}>
          <Text fontSize="xs" color="gray.500" mb={4}>
            Guarde el código de seguimiento para consultar el avance de su trámite más adelante.
          </Text>
          <HStack gap={4} width="100%">
            <Button colorPalette="blue" variant="solid" onClick={() => window.print()} flex={1}>
              Imprimir Constancia
            </Button>
            <Button colorPalette="gray" variant="outline" onClick={onRegresar} flex={1}>
              Registrar Otro Trámite
            </Button>
          </HStack>
        </Box>
      </Stack>
    </Card.Root>
  );
}
