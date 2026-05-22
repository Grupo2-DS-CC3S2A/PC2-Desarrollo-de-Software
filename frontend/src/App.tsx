import { useState, type ReactElement } from "react";
import { Box, Flex, Image, Stack, Text, Heading, Button, HStack } from "@chakra-ui/react";

import { SolicitudForm } from "@/components/SolicitudForm";
import { SolicitudReceipt } from "@/components/SolicitudReceipt";
import { SolicitudLookup } from "@/components/SolicitudLookup";
import { AdminDerivacionPanel } from "@/components/AdminDerivacionPanel";
import type { Solicitud } from "@/types/derivacion";

type Rol = "ciudadano" | "admin";
type SeccionCiudadano = "registrar" | "consultar";

export default function App(): ReactElement {
  const [rol, setRol] = useState<Rol>("ciudadano");
  const [seccionCiudadano, setSeccionCiudadano] = useState<SeccionCiudadano>("registrar");
  const [solicitudCreada, setSolicitudCreada] = useState<Solicitud | null>(null);

  const handleSolicitudCreada = (solicitud: Solicitud): void => {
    setSolicitudCreada(solicitud);
  };

  return (
    <Box minH="100vh" bg="gray.950" color="gray.100" fontFamily="sans-serif">
      {/* Barra superior institucional */}
      <Box bg="#0F1E36" py={4} px={8} borderBottom="1px solid" borderColor="blue.900" shadow="md">
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <Flex align="center" gap={3}>
            <Image src="/reniec_logo.png" alt="RENIEC" h="45px" />
            <Box>
              <Text color="white" fontWeight="extrabold" fontSize="md" letterSpacing="wider">
                RENIEC
              </Text>
              <Text color="blue.300" fontSize="xs" fontWeight="semibold">
                Mesa de Partes Electrónica
              </Text>
            </Box>
          </Flex>

          {/* Selector de Rol */}
          <HStack gap={2}>
            <Button
              onClick={() => setRol("ciudadano")}
              variant={rol === "ciudadano" ? "solid" : "ghost"}
              colorPalette="blue"
              size="sm"
              fontWeight="bold"
            >
              Portal Ciudadano
            </Button>
            <Button
              onClick={() => setRol("admin")}
              variant={rol === "admin" ? "solid" : "ghost"}
              colorPalette="blue"
              size="sm"
              fontWeight="bold"
            >
              Portal Administrador
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Contenido principal */}
      <Box maxW="1200px" mx="auto" px={6} py={8}>
        {rol === "ciudadano" ? (
          <Stack gap={6}>
            {/* Cabecera del Portal Ciudadano */}
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={4} bg="gray.900" p={4} borderRadius="lg" borderWidth="1px" borderColor="gray.800">
              <Box>
                <Heading size="md" color="blue.300">
                  Portal de Trámites al Ciudadano
                </Heading>
                <Text fontSize="xs" color="gray.400">
                  Registre nuevas solicitudes o consulte el estado de trámites presentados.
                </Text>
              </Box>
              <HStack gap={2}>
                <Button
                  onClick={() => {
                    setSeccionCiudadano("registrar");
                    setSolicitudCreada(null);
                  }}
                  variant={seccionCiudadano === "registrar" ? "subtle" : "ghost"}
                  colorPalette="blue"
                  size="sm"
                >
                  Registrar Solicitud
                </Button>
                <Button
                  onClick={() => setSeccionCiudadano("consultar")}
                  variant={seccionCiudadano === "consultar" ? "subtle" : "ghost"}
                  colorPalette="blue"
                  size="sm"
                >
                  Consultar Estado
                </Button>
              </HStack>
            </Flex>

            {/* Vistas Ciudadano */}
            {seccionCiudadano === "registrar" ? (
              solicitudCreada ? (
                <SolicitudReceipt
                  solicitud={solicitudCreada}
                  onRegresar={() => setSolicitudCreada(null)}
                />
              ) : (
                <Flex direction={{ base: "column", md: "row" }} gap={8} align="stretch">
                  {/* Panel izquierdo decorativo e instructivo */}
                  <Box
                    flex="1"
                    bg="radial-gradient(circle, #0F1E36 0%, #081121 100%)"
                    borderRadius="2xl"
                    borderWidth="1px"
                    borderColor="blue.900"
                    p={8}
                    display="flex"
                    flexDirection="column"
                    justifyContent="space-between"
                    minH="400px"
                  >
                    <Stack gap={4}>
                      <Badge colorPalette="blue" width="fit-content" px={2} py={0.5}>
                        RENIEC DIGITAL
                      </Badge>
                      <Heading size="lg" color="white" fontWeight="extrabold" lineHeight="short">
                        Mesa de Partes Virtual
                      </Heading>
                      <Text color="gray.300" fontSize="sm" lineHeight="relaxed">
                        Presente solicitudes de forma rápida y segura desde su hogar. 
                        El sistema calculará automáticamente el plazo máximo de atención de acuerdo a la prioridad del trámite:
                      </Text>
                      <Stack gap={2} pl={2} borderLeftWidth="2px" borderColor="blue.500" py={1}>
                        <Text fontSize="xs" color="gray.300">
                          <strong>Trámite Normal:</strong> 30 días hábiles
                        </Text>
                        <Text fontSize="xs" color="gray.300">
                          <strong>Trámite Urgente:</strong> 15 días calendarios
                        </Text>
                      </Stack>
                    </Stack>

                    <Box pt={4}>
                      <Text color="gray.500" fontSize="xx-small" letterSpacing="widest" textTransform="uppercase">
                        Sistema Protegido · Ley N° 27269
                      </Text>
                    </Box>
                  </Box>

                  {/* Formulario */}
                  <Box flex="1.5">
                    <SolicitudForm onSolicitudCreada={handleSolicitudCreada} />
                  </Box>
                </Flex>
              )
            ) : (
              <SolicitudLookup />
            )}
          </Stack>
        ) : (
          /* Portal Administrador */
          <AdminDerivacionPanel />
        )}
      </Box>

      {/* Pie de página */}
      <Box as="footer" py={6} mt={12} borderTopWidth="1px" borderColor="gray.800" bg="gray.950" color="gray.500" textAlign="center" fontSize="xs">
        <Text>
          © 2026 Registro Nacional de Identificación y Estado Civil (RENIEC) — Mesa de Partes Electrónica.
        </Text>
        <Text mt={1} color="gray.600">
          Todos los derechos reservados. El uso de esta plataforma está regulado por la Ley de Firmas y Certificados Digitales.
        </Text>
      </Box>
    </Box>
  );
}

// Elementos auxiliares no exportados en Chakra pero usados localmente
function Badge({ children, colorPalette, ...props }: any): ReactElement {
  return (
    <Box
      display="inline-block"
      px={2}
      py={0.5}
      borderRadius="md"
      fontSize="xs"
      fontWeight="bold"
      bg={colorPalette === "blue" ? "blue.900" : "gray.800"}
      color={colorPalette === "blue" ? "blue.200" : "gray.300"}
      borderWidth="1px"
      borderColor={colorPalette === "blue" ? "blue.700" : "gray.700"}
      {...props}
    >
      {children}
    </Box>
  );
}
