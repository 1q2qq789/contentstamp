// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ContentStamp - 链上内容存证
/// @notice 存内容哈希 + 元数据上链，提供不可篡改的时间戳证明
contract ContentStamp {
    /// @notice 存证记录结构
    struct Stamp {
        address author;       // 存证者地址（谁付 Gas 上链的）
        bytes32 contentHash;  // 内容 SHA256 哈希
        string metadataURI;   // 可选元数据（标题/URL/类型等）
        string authorName;    // 创作者身份声明（姓名/笔名/URL），为空表示未声明
        uint256 timestamp;    // 上链时间戳
    }

    /// @notice stampId → Stamp
    mapping(uint256 => Stamp) public stamps;
    
    /// @notice 总存证数
    uint256 public totalStamps;
    
    /// @notice 每个地址的存证数
    mapping(address => uint256) public authorStampCount;
    
    // ─── 事件 ───
    event ContentStamped(
        uint256 indexed stampId,
        address indexed author,
        bytes32 indexed contentHash,
        string metadataURI,
        uint256 timestamp
    );

    /// @notice 带创作者身份声明的存证事件
    event ContentStampedWithAuthor(
        uint256 indexed stampId,
        address indexed author,
        bytes32 indexed contentHash,
        string authorName,
        string metadataURI,
        uint256 timestamp
    );

    // ─── 核心功能 ───

    /// @notice 存证内容（基础版，不声明创作者身份）
    /// @param contentHash 内容的 SHA256 哈希
    /// @param metadataURI 可选元数据（标题、URL、作者等，建议JSON格式或纯文本）
    /// @return stampId 存证记录 ID
    function stamp(bytes32 contentHash, string calldata metadataURI)
        external
        returns (uint256 stampId)
    {
        return _stamp(contentHash, metadataURI, "");
    }

    /// @notice 存证内容并声明创作者身份
    /// @param contentHash 内容的 SHA256 哈希
    /// @param metadataURI 可选元数据
    /// @param authorName 创作者身份声明（姓名/笔名/个人主页URL等）
    /// @return stampId 存证记录 ID
    function stampWithAuthor(
        bytes32 contentHash,
        string calldata metadataURI,
        string calldata authorName
    ) external returns (uint256 stampId) {
        require(bytes(authorName).length > 0, "AuthorName cannot be empty");
        return _stamp(contentHash, metadataURI, authorName);
    }

    /// @dev 内部存证逻辑
    function _stamp(
        bytes32 contentHash,
        string memory metadataURI,
        string memory authorName
    ) internal returns (uint256 stampId) {
        require(contentHash != bytes32(0), "ContentHash cannot be empty");

        stampId = totalStamps;
        stamps[stampId] = Stamp({
            author: msg.sender,
            contentHash: contentHash,
            metadataURI: metadataURI,
            authorName: authorName,
            timestamp: block.timestamp
        });

        totalStamps++;
        authorStampCount[msg.sender]++;

        if (bytes(authorName).length > 0) {
            emit ContentStampedWithAuthor(
                stampId, msg.sender, contentHash, authorName, metadataURI, block.timestamp
            );
        } else {
            emit ContentStamped(stampId, msg.sender, contentHash, metadataURI, block.timestamp);
        }
    }

    /// @notice 批量存证（用于一次性存证多篇内容）
    function stampBatch(
        bytes32[] calldata contentHashes,
        string[] calldata metadataURIs
    ) external returns (uint256[] memory stampIds) {
        require(contentHashes.length == metadataURIs.length, "Length mismatch");
        stampIds = new uint256[](contentHashes.length);
        for (uint256 i = 0; i < contentHashes.length; i++) {
            stampIds[i] = _stamp(contentHashes[i], metadataURIs[i], "");
        }
        return stampIds;
    }

    /// @notice 批量存证并声明创作者身份
    function stampBatchWithAuthor(
        bytes32[] calldata contentHashes,
        string[] calldata metadataURIs,
        string[] calldata authorNames
    ) external returns (uint256[] memory stampIds) {
        require(contentHashes.length == metadataURIs.length, "Length mismatch");
        require(contentHashes.length == authorNames.length, "Length mismatch");
        stampIds = new uint256[](contentHashes.length);
        for (uint256 i = 0; i < contentHashes.length; i++) {
            require(bytes(authorNames[i]).length > 0, "AuthorName cannot be empty");
            stampIds[i] = _stamp(contentHashes[i], metadataURIs[i], authorNames[i]);
        }
        return stampIds;
    }

    // ─── 查询功能 ───

    /// @notice 根据 stampId 查询存证记录
    function getStamp(uint256 stampId)
        external
        view
        returns (Stamp memory)
    {
        require(stampId < totalStamps, "Stamp not found");
        return stamps[stampId];
    }

    /// @notice 验证内容哈希是否已存证
    /// @return exists 是否存在，stampId 存证ID，timestamp 存证时间
    function verify(bytes32 contentHash)
        external
        view
        returns (bool exists, uint256 stampId, uint256 timestamp)
    {
        // 从最新开始倒查（同一内容可能多次存证，返回最新的）
        for (uint256 i = totalStamps; i > 0; i--) {
            uint256 idx = i - 1;
            if (stamps[idx].contentHash == contentHash) {
                return (true, idx, stamps[idx].timestamp);
            }
        }
        return (false, 0, 0);
    }

    /// @notice 根据哈希查找所有匹配的存证记录 ID（同一内容可能被不同人存证）
    function findByHash(bytes32 contentHash)
        external
        view
        returns (uint256[] memory stampIds)
    {
        // 先统计匹配数
        uint256 count = 0;
        for (uint256 i = 0; i < totalStamps; i++) {
            if (stamps[i].contentHash == contentHash) {
                count++;
            }
        }
        stampIds = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < totalStamps; i++) {
            if (stamps[i].contentHash == contentHash) {
                stampIds[idx] = i;
                idx++;
            }
        }
        return stampIds;
    }

    /// @notice 获取作者的存证记录
    function getStampsByAuthor(address author)
        external
        view
        returns (uint256[] memory stampIds)
    {
        uint256 count = authorStampCount[author];
        stampIds = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < totalStamps; i++) {
            if (stamps[i].author == author) {
                stampIds[idx] = i;
                idx++;
            }
        }
        return stampIds;
    }
}
