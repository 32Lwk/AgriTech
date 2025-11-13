"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  HStack,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  IconButton,
  FormHelperText,
} from "@chakra-ui/react";
import { FiEdit, FiTrash2, FiPlus, FiX, FiMapPin } from "react-icons/fi";
import { farmlandsApi, type Farmland, type CreateFarmlandPayload, type UpdateFarmlandPayload } from "../api/farmlands";
import { uploadApi } from "../api/upload";
import LeafletMap from "@/components/map/LeafletMap";

interface FarmlandManagerProps {
  farmerId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FarmlandManager({ farmerId, isOpen, onClose }: FarmlandManagerProps) {
  const toast = useToast();
  const editModal = useDisclosure();
  const [farmlands, setFarmlands] = useState<Farmland[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingFarmland, setEditingFarmland] = useState<Farmland | null>(null);
  const [formData, setFormData] = useState<CreateFarmlandPayload>({
    farmerId,
    name: "",
    latitude: undefined,
    longitude: undefined,
    description: "",
    imageUrls: [],
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const fetchFarmlands = useCallback(async () => {
    if (!farmerId) return;
    setLoading(true);
    try {
      const data = await farmlandsApi.getFarmlands(farmerId);
      setFarmlands(data);
    } catch (error) {
      console.error(error);
      toast({ title: "農地一覧の取得に失敗しました", status: "error" });
    } finally {
      setLoading(false);
    }
  }, [farmerId, toast]);

  useEffect(() => {
    if (isOpen && farmerId) {
      fetchFarmlands();
    }
  }, [isOpen, farmerId, fetchFarmlands]);

  const handleCreate = () => {
    setEditingFarmland(null);
    setFormData({
      farmerId,
      name: "",
      latitude: undefined,
      longitude: undefined,
      description: "",
      imageUrls: [],
    });
    setSelectedLocation(null);
    editModal.onOpen();
  };

  const handleEdit = (farmland: Farmland) => {
    setEditingFarmland(farmland);
    const imageUrls = farmland.imageUrls && Array.isArray(farmland.imageUrls) 
      ? farmland.imageUrls 
      : farmland.imageUrl 
        ? [farmland.imageUrl] 
        : [];
    setFormData({
      farmerId,
      name: farmland.name,
      latitude: farmland.latitude ?? undefined,
      longitude: farmland.longitude ?? undefined,
      imageUrls,
      description: farmland.description ?? undefined,
    });
    if (farmland.latitude && farmland.longitude) {
      setSelectedLocation({ lat: farmland.latitude, lng: farmland.longitude });
    } else {
      setSelectedLocation(null);
    }
    editModal.onOpen();
  };

  const handleDelete = async (farmlandId: string) => {
    if (!confirm("この農地を削除してもよろしいですか？")) return;
    try {
      await farmlandsApi.deleteFarmland(farmlandId, farmerId);
      toast({ title: "農地を削除しました", status: "success" });
      fetchFarmlands();
    } catch (error) {
      console.error(error);
      toast({ title: "農地の削除に失敗しました", status: "error" });
    }
  };

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "現在地の取得に対応していません",
        description: "お使いのブラウザはGeolocation APIに対応していません。",
        status: "error",
      });
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setSelectedLocation({ lat: latitude, lng: longitude });
        setFormData((prev) => ({ ...prev, latitude, longitude }));
        setGettingLocation(false);
        toast({
          title: "現在地を取得しました",
          status: "success",
        });
      },
      (error) => {
        setGettingLocation(false);
        let errorMessage = "現在地の取得に失敗しました";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "位置情報の使用が拒否されました。ブラウザの設定を確認してください。";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "位置情報が利用できません。";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "位置情報の取得がタイムアウトしました。";
        }
        toast({
          title: errorMessage,
          status: "error",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [toast]);

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 10 - (formData.imageUrls?.length || 0);
    if (files.length > remainingSlots) {
      toast({
        title: `画像は最大10件までアップロードできます。残り${remainingSlots}件です。`,
        status: "warning",
      });
      return;
    }

    // プレビュー用にファイルを読み込み
    const fileReaders: Promise<string>[] = files.map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string);
          } else {
            reject(new Error("ファイルの読み込みに失敗しました"));
          }
        };
        reader.onerror = () => reject(new Error("ファイルの読み込みエラー"));
        reader.readAsDataURL(file);
      });
    });

    // プレビューを表示してからアップロード
    setUploadingImages(true);
    Promise.all(fileReaders)
      .then((previews) => {
        // プレビューを即座に表示（一時的なURL）
        const tempUrls = previews.map((preview) => preview);
        setFormData((prev) => ({
          ...prev,
          imageUrls: [...(prev.imageUrls || []), ...tempUrls],
        }));

        // バックエンドにアップロード
        const uploadPromises = files.map((file) => uploadApi.uploadFile(file));
        return Promise.all(uploadPromises);
      })
      .then((uploaded) => {
        // 一時的なプレビューURLを実際のアップロードURLに置き換え
        setFormData((prev) => {
          const tempCount = files.length;
          const withoutTemp = (prev.imageUrls || []).slice(0, -tempCount);
          const serverUrls = uploaded.map((u) => {
            // バックエンドからのURLが相対パスの場合、フルURLに変換
            if (u.url.startsWith("/")) {
              const apiBase = typeof window !== "undefined" 
                ? (process.env.NEXT_PUBLIC_UPLOAD_API_BASE || "http://localhost:4000")
                : "http://localhost:4000";
              return u.url.startsWith("/uploads") ? `${apiBase.replace("/api/upload", "")}${u.url}` : `${apiBase}${u.url}`;
            }
            return u.url;
          });
          return {
            ...prev,
            imageUrls: [...withoutTemp, ...serverUrls],
          };
        });
        setUploadingImages(false);
        toast({
          title: `${uploaded.length}件の画像をアップロードしました`,
          status: "success",
        });
      })
      .catch((error) => {
        console.error(error);
        // エラー時は一時的なプレビューを削除
        setFormData((prev) => ({
          ...prev,
          imageUrls: (prev.imageUrls || []).slice(0, -files.length),
        }));
        setUploadingImages(false);
        toast({
          title: "画像のアップロードに失敗しました",
          status: "error",
        });
      })
      .finally(() => {
        event.target.value = "";
      });
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: (prev.imageUrls || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({ title: "農地名称を入力してください", status: "error" });
      return;
    }
    if (!formData.latitude || !formData.longitude) {
      toast({ title: "マップで位置を選択してください", status: "error" });
      return;
    }

    try {
      if (editingFarmland) {
        const updatePayload: UpdateFarmlandPayload = {
          name: formData.name,
          latitude: formData.latitude,
          longitude: formData.longitude,
          imageUrls: formData.imageUrls,
          description: formData.description,
        };
        await farmlandsApi.updateFarmland(editingFarmland.id, farmerId, updatePayload);
        toast({ title: "農地を更新しました", status: "success" });
      } else {
        await farmlandsApi.createFarmland(formData);
        toast({ title: "農地を登録しました", status: "success" });
      }
      editModal.onClose();
      fetchFarmlands();
    } catch (error) {
      console.error(error);
      toast({ title: editingFarmland ? "農地の更新に失敗しました" : "農地の登録に失敗しました", status: "error" });
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>農地管理</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600">
                  登録済みの農地を管理できます。募集作成時に選択できます。
                </Text>
                <Button size="sm" colorScheme="green" leftIcon={<FiPlus />} onClick={handleCreate}>
                  農地を追加
                </Button>
              </HStack>
              {loading ? (
                <Text fontSize="sm" color="gray.500">読み込み中...</Text>
              ) : farmlands.length === 0 ? (
                <Card variant="outline">
                  <CardBody>
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      登録済みの農地がありません。農地を追加してください。
                    </Text>
                  </CardBody>
                </Card>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {farmlands.map((farmland) => {
                    const imageUrls = farmland.imageUrls && Array.isArray(farmland.imageUrls) 
                      ? farmland.imageUrls 
                      : farmland.imageUrl 
                        ? [farmland.imageUrl] 
                        : [];
                    return (
                      <Card key={farmland.id} variant="outline">
                        <CardBody>
                          <Stack spacing={3}>
                            {imageUrls.length > 0 && (
                              <Box borderRadius="md" overflow="hidden">
                                <Image src={imageUrls[0]} alt={farmland.name} w="100%" h="120px" objectFit="cover" />
                                {imageUrls.length > 1 && (
                                  <Text fontSize="xs" color="gray.500" mt={1} textAlign="center">
                                    他 {imageUrls.length - 1} 枚
                                  </Text>
                                )}
                              </Box>
                            )}
                            <Stack spacing={1}>
                              <Text fontWeight="semibold">{farmland.name}</Text>
                              {farmland.latitude && farmland.longitude && (
                                <Text fontSize="xs" color="gray.600">
                                  緯度: {farmland.latitude.toFixed(6)}, 経度: {farmland.longitude.toFixed(6)}
                                </Text>
                              )}
                              {farmland.description && (
                                <Text fontSize="xs" color="gray.600" noOfLines={2}>
                                  {farmland.description}
                                </Text>
                              )}
                            </Stack>
                            <HStack spacing={2}>
                              <Button
                                size="xs"
                                variant="outline"
                                leftIcon={<FiEdit />}
                                onClick={() => handleEdit(farmland)}
                              >
                                編集
                              </Button>
                              <IconButton
                                size="xs"
                                variant="outline"
                                colorScheme="red"
                                aria-label="削除"
                                icon={<FiTrash2 />}
                                onClick={() => handleDelete(farmland.id)}
                              />
                            </HStack>
                          </Stack>
                        </CardBody>
                      </Card>
                    );
                  })}
                </SimpleGrid>
              )}
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>
              閉じる
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={editModal.isOpen} onClose={editModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingFarmland ? "農地を編集" : "農地を追加"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>農地名称</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="例：本圃場、第2圃場"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>位置</FormLabel>
                <FormHelperText fontSize="xs" mb={2}>
                  マップをクリックして位置を選択するか、現在地ボタンを使用してください。
                </FormHelperText>
                <HStack spacing={2} mb={2}>
                  <Button
                    size="sm"
                    leftIcon={<FiMapPin />}
                    onClick={handleGetCurrentLocation}
                    isLoading={gettingLocation}
                    loadingText="取得中..."
                    variant="outline"
                    colorScheme="green"
                  >
                    現在地を使用
                  </Button>
                </HStack>
                <Box borderRadius="md" overflow="hidden" borderWidth="1px" mb={2}>
                  <LeafletMap
                    markers={
                      selectedLocation
                        ? [
                            {
                              id: "selected-location",
                              position: [selectedLocation.lat, selectedLocation.lng],
                              title: "選択された位置",
                              variant: "default",
                            },
                          ]
                        : []
                    }
                    center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [35.6812, 139.7671]}
                    zoom={selectedLocation ? 15 : 13}
                    height={300}
                    onMapClick={handleMapClick}
                    showPopups={true}
                  />
                </Box>
                {selectedLocation && (
                  <Text fontSize="xs" color="green.600">
                    緯度: {selectedLocation.lat.toFixed(6)}, 経度: {selectedLocation.lng.toFixed(6)}
                  </Text>
                )}
              </FormControl>
              <FormControl>
                <FormLabel>農地画像</FormLabel>
                <FormHelperText fontSize="xs" mb={2}>
                  最大10件までアップロードできます。現在 {(formData.imageUrls?.length || 0)}/10 件
                </FormHelperText>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  disabled={uploadingImages || (formData.imageUrls?.length || 0) >= 10}
                />
                {uploadingImages && (
                  <Text fontSize="xs" color="blue.500" mt={1}>
                    アップロード中... 画像は選択と同時に確認できます。
                  </Text>
                )}
                {formData.imageUrls && formData.imageUrls.length > 0 && (
                  <Box mt={3}>
                    <Text fontSize="xs" color="gray.600" mb={2}>
                      アップロード済み画像（クリックで拡大表示）
                    </Text>
                    <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
                      {formData.imageUrls.map((url, index) => (
                        <Box
                          key={index}
                          position="relative"
                          borderRadius="md"
                          overflow="hidden"
                          borderWidth="1px"
                          cursor="pointer"
                          _hover={{ borderColor: "green.400", borderWidth: "2px" }}
                          onClick={() => {
                            // モーダルで拡大表示
                            const newWindow = window.open();
                            if (newWindow) {
                              newWindow.document.write(`<img src="${url}" style="max-width:100%; height:auto;" />`);
                            }
                          }}
                        >
                          <Image
                            src={url}
                            alt={`農地画像 ${index + 1}`}
                            w="100%"
                            h="120px"
                            objectFit="cover"
                          />
                          <IconButton
                            aria-label="画像を削除"
                            icon={<FiX />}
                            size="xs"
                            colorScheme="red"
                            position="absolute"
                            top={1}
                            right={1}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(index);
                            }}
                          />
                        </Box>
                      ))}
                    </SimpleGrid>
                  </Box>
                )}
              </FormControl>
              <FormControl>
                <FormLabel>説明（オプション）</FormLabel>
                <Textarea
                  value={formData.description ?? ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="農地の特徴や注意事項など"
                  rows={3}
                />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={editModal.onClose}>
              キャンセル
            </Button>
            <Button colorScheme="green" onClick={handleSubmit}>
              {editingFarmland ? "更新" : "登録"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

