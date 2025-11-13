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
} from "@chakra-ui/react";
import { FiEdit, FiTrash2, FiPlus, FiX } from "react-icons/fi";
import { farmlandsApi, type Farmland, type CreateFarmlandPayload, type UpdateFarmlandPayload } from "../api/farmlands";
import { uploadApi } from "../api/upload";

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
    address: "",
    prefecture: "",
    city: "",
    description: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);

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
      address: "",
      prefecture: "",
      city: "",
      description: "",
    });
    editModal.onOpen();
  };

  const handleEdit = (farmland: Farmland) => {
    setEditingFarmland(farmland);
    setFormData({
      farmerId,
      name: farmland.name,
      address: farmland.address,
      prefecture: farmland.prefecture,
      city: farmland.city,
      latitude: farmland.latitude ?? undefined,
      longitude: farmland.longitude ?? undefined,
      imageUrl: farmland.imageUrl ?? undefined,
      description: farmland.description ?? undefined,
    });
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const uploaded = await uploadApi.uploadFile(file);
      setFormData((prev) => ({ ...prev, imageUrl: uploaded.url }));
      toast({ title: "画像をアップロードしました", status: "success" });
    } catch (error) {
      console.error(error);
      toast({ title: "画像のアップロードに失敗しました", status: "error" });
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.address.trim() || !formData.prefecture.trim() || !formData.city.trim()) {
      toast({ title: "必須項目を入力してください", status: "error" });
      return;
    }

    try {
      if (editingFarmland) {
        const updatePayload: UpdateFarmlandPayload = {
          name: formData.name,
          address: formData.address,
          prefecture: formData.prefecture,
          city: formData.city,
          latitude: formData.latitude,
          longitude: formData.longitude,
          imageUrl: formData.imageUrl,
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
                  {farmlands.map((farmland) => (
                    <Card key={farmland.id} variant="outline">
                      <CardBody>
                        <Stack spacing={3}>
                          {farmland.imageUrl && (
                            <Box borderRadius="md" overflow="hidden">
                              <Image src={farmland.imageUrl} alt={farmland.name} w="100%" h="120px" objectFit="cover" />
                            </Box>
                          )}
                          <Stack spacing={1}>
                            <Text fontWeight="semibold">{farmland.name}</Text>
                            <Text fontSize="xs" color="gray.600">
                              {farmland.prefecture} {farmland.city}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {farmland.address}
                            </Text>
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
                  ))}
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
                <FormLabel>都道府県</FormLabel>
                <Input
                  value={formData.prefecture}
                  onChange={(e) => setFormData((prev) => ({ ...prev, prefecture: e.target.value }))}
                  placeholder="例：愛知県"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>市区町村</FormLabel>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="例：豊橋市"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>住所</FormLabel>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="例：石巻町123-45"
                />
              </FormControl>
              <FormControl>
                <FormLabel>緯度（オプション）</FormLabel>
                <Input
                  type="number"
                  step="any"
                  value={formData.latitude ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      latitude: e.target.value ? parseFloat(e.target.value) : undefined,
                    }))
                  }
                  placeholder="例：34.7654"
                />
              </FormControl>
              <FormControl>
                <FormLabel>経度（オプション）</FormLabel>
                <Input
                  type="number"
                  step="any"
                  value={formData.longitude ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      longitude: e.target.value ? parseFloat(e.target.value) : undefined,
                    }))
                  }
                  placeholder="例：137.3921"
                />
              </FormControl>
              <FormControl>
                <FormLabel>農地画像</FormLabel>
                {formData.imageUrl && (
                  <Box mb={2}>
                    <Image src={formData.imageUrl} alt="農地画像" maxH="200px" borderRadius="md" />
                    <Button
                      size="xs"
                      mt={2}
                      leftIcon={<FiX />}
                      onClick={() => setFormData((prev) => ({ ...prev, imageUrl: undefined }))}
                    >
                      画像を削除
                    </Button>
                  </Box>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                {uploadingImage && <Text fontSize="xs" color="gray.500">アップロード中...</Text>}
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

