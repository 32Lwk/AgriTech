"use client";

import { Flex, Heading, HStack, Text } from "@chakra-ui/react";

type DashboardHeaderProps = {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
};

export default function DashboardHeader({
  title,
  subtitle,
  rightSlot,
}: DashboardHeaderProps) {
  // タイトルから「農家」「労働者」「管理者」を抽出して緑色にする
  const renderTitle = () => {
    const roleKeywords = ["農家", "労働者", "管理者"];
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let currentText = title;

    for (const keyword of roleKeywords) {
      const index = currentText.indexOf(keyword);
      if (index !== -1) {
        // キーワードの前のテキスト
        if (index > 0) {
          parts.push(currentText.substring(0, index));
        }
        // キーワードを緑色で表示
        parts.push(
          <Text as="span" key={keyword} color="agri.600" fontWeight="700">
            {keyword}
          </Text>
        );
        // 残りのテキスト
        currentText = currentText.substring(index + keyword.length);
        lastIndex = index + keyword.length;
      }
    }

    // 残りのテキストを追加
    if (currentText.length > 0) {
      parts.push(currentText);
    }

    // マッチしなかった場合は元のタイトルを返す
    if (parts.length === 0) {
      return title;
    }

    return <>{parts}</>;
  };

  return (
    <Flex
      px={{ base: 4, md: 6 }}
      py={{ base: 3, md: 4 }}
      align="center"
      justify="space-between"
      gap={4}
    >
      <Flex direction="column">
        <Heading size="md">{renderTitle()}</Heading>
        {subtitle ? (
          <Text fontSize="sm" color="gray.600" mt={1}>
            {subtitle}
          </Text>
        ) : null}
      </Flex>
      {rightSlot ? <HStack spacing={3}>{rightSlot}</HStack> : null}
    </Flex>
  );
}

