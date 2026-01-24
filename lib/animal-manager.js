const fs = require('fs').promises;
const path = require('path');

class AnimalManager {
    constructor() {
        // 基础URL配置
        this.githubRawBase = 'https://raw.githubusercontent.com/lsqkk/animal-recognition-dataset/main';
        this.cdnBase = 'https://cdn.jsdelivr.net/gh/lsqkk/animal-recognition-dataset@main';

        // 数据结构缓存
        this.categoryCache = null;
        this.imageIndexCache = null;
        this.cacheTimestamp = null;
        this.cacheTTL = 10 * 60 * 1000; // 10分钟缓存
    }

    // 获取数据集结构
    async getDatasetStructure() {
        const now = Date.now();

        if (this.categoryCache && this.cacheTimestamp &&
            (now - this.cacheTimestamp) < this.cacheTTL) {
            return this.categoryCache;
        }

        // 这里模拟数据结构，实际可以从GitHub API获取或本地配置文件
        const structure = {
            categories: [
                {
                    id: 'cat',
                    name: '猫',
                    subcategories: [
                        { id: 'cat_mixed', name: '混合猫', count: 579 },
                        { id: 'jiafei', name: '加菲猫', count: 255 },
                        { id: 'jumao', name: '橘猫', count: 772 },
                        { id: 'sanhua', name: '三花猫', count: 84 }
                    ],
                    total: 1690
                },
                {
                    id: 'dog',
                    name: '狗',
                    subcategories: [
                        { id: 'dog_mixed', name: '混合狗', count: 995 },
                        { id: 'fadou', name: '法斗', count: 590 },
                        { id: 'hashiqi', name: '哈士奇', count: 890 },
                        { id: 'jinmao', name: '金毛', count: 634 },
                        { id: 'keji', name: '柯基', count: 682 },
                        { id: 'samoye', name: '萨摩耶', count: 1139 }
                    ],
                    total: 4930
                },
                {
                    id: 'livestock',
                    name: '牲畜',
                    subcategories: [
                        { id: 'cattle', name: '牛', count: 369 },
                        { id: 'horse', name: '马', count: 224 }
                    ],
                    total: 593
                },
                {
                    id: 'man',
                    name: '人类',
                    subcategories: [
                        { id: 'blackman', name: '黑人', count: 798 },
                        { id: 'whiteman', name: '白人', count: 745 }
                    ],
                    total: 1543
                },
                {
                    id: 'poultry',
                    name: '家禽',
                    subcategories: [
                        { id: 'chicken', name: '鸡', count: 367 },
                        { id: 'goose', name: '鹅', count: 634 }
                    ],
                    total: 1001
                }
            ],
            stats: {
                total_categories: 5,
                total_subcategories: 17,
                total_images: 9757,
                last_updated: new Date().toISOString()
            }
        };

        this.categoryCache = structure;
        this.cacheTimestamp = now;

        return structure;
    }

    // 获取所有图片索引
    async getAllImagesIndex() {
        const now = Date.now();

        if (this.imageIndexCache && this.cacheTimestamp &&
            (now - this.cacheTimestamp) < this.cacheTTL) {
            return this.imageIndexCache;
        }

        const structure = await this.getDatasetStructure();
        const allImages = [];

        for (const category of structure.categories) {
            for (const subcategory of category.subcategories) {
                for (let i = 1; i <= subcategory.count; i++) {
                    const filename = `${subcategory.id}_${i}.jpg`;
                    allImages.push({
                        id: `${subcategory.id}-${i}`,
                        subcategoryId: subcategory.id,
                        categoryId: category.id,
                        filename: filename,
                        name: `${subcategory.name} ${i}`,
                        subcategoryName: subcategory.name,
                        categoryName: category.name,
                        index: i,
                        urls: {
                            github: `${this.githubRawBase}/${category.id}/${subcategory.id}/${filename}`,
                            cdn: `${this.cdnBase}/${category.id}/${subcategory.id}/${filename}`,
                            thumbnail: `${this.cdnBase}/${category.id}/${subcategory.id}/${filename}?width=300`
                        }
                    });
                }
            }
        }

        this.imageIndexCache = allImages;
        return allImages;
    }

    // 获取随机图片
    async getRandomImages(count = 1, options = {}) {
        const { category, subcategory, useCdn = true } = options;
        const allImages = await this.getAllImagesIndex();

        // 筛选图片
        let filteredImages = allImages;

        if (subcategory) {
            filteredImages = filteredImages.filter(img => img.subcategoryId === subcategory);
        } else if (category) {
            filteredImages = filteredImages.filter(img => img.categoryId === category);
        }

        if (filteredImages.length === 0) {
            throw new Error('No images found matching the criteria');
        }

        // 随机选择
        const shuffled = [...filteredImages].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(count, 20));

        // 处理URL选择
        return selected.map(img => ({
            ...img,
            url: useCdn ? img.urls.cdn : img.urls.github,
            thumbnail: img.urls.thumbnail
        }));
    }

    // 按ID获取图片
    async getImageById(imageId, options = {}) {
        const { useCdn = true } = options;
        const allImages = await this.getAllImagesIndex();

        const image = allImages.find(img => img.id === imageId);

        if (!image) {
            throw new Error(`Image not found: ${imageId}`);
        }

        return {
            ...image,
            url: useCdn ? image.urls.cdn : image.urls.github,
            thumbnail: image.urls.thumbnail,
            navigation: await this.getImageNavigation(image)
        };
    }

    // 获取图片导航信息
    async getImageNavigation(image) {
        const allImages = await this.getAllImagesIndex();
        const currentIndex = allImages.findIndex(img => img.id === image.id);

        return {
            previous: currentIndex > 0 ? allImages[currentIndex - 1].id : null,
            next: currentIndex < allImages.length - 1 ? allImages[currentIndex + 1].id : null,
            current_position: currentIndex + 1,
            total_images: allImages.length
        };
    }

    // 搜索图片
    async searchImages(query, options = {}) {
        const { category, subcategory, limit = 20, page = 1, useCdn = true } = options;
        const allImages = await this.getAllImagesIndex();

        const searchTerm = query.toLowerCase();
        let results = allImages.filter(img =>
            img.name.toLowerCase().includes(searchTerm) ||
            img.subcategoryName.toLowerCase().includes(searchTerm) ||
            img.categoryName.toLowerCase().includes(searchTerm)
        );

        // 应用筛选
        if (subcategory) {
            results = results.filter(img => img.subcategoryId === subcategory);
        } else if (category) {
            results = results.filter(img => img.categoryId === category);
        }

        // 分页
        const startIndex = (page - 1) * limit;
        const paginatedResults = results.slice(startIndex, startIndex + limit);

        // 处理URL
        const processedResults = paginatedResults.map(img => ({
            ...img,
            url: useCdn ? img.urls.cdn : img.urls.github,
            thumbnail: img.urls.thumbnail
        }));

        return {
            results: processedResults,
            pagination: {
                page,
                limit,
                total_results: results.length,
                total_pages: Math.ceil(results.length / limit),
                has_next: startIndex + limit < results.length,
                has_prev: page > 1
            }
        };
    }

    // 获取图片范围
    async getImagesInRange(subcategoryId, start = 0, end = 10, options = {}) {
        const { useCdn = true } = options;
        const allImages = await this.getAllImagesIndex();

        const subcategoryImages = allImages
            .filter(img => img.subcategoryId === subcategoryId)
            .sort((a, b) => a.index - b.index);

        if (subcategoryImages.length === 0) {
            throw new Error(`Subcategory not found: ${subcategoryId}`);
        }

        const images = subcategoryImages.slice(start, end);

        return {
            subcategory: subcategoryImages[0].subcategoryName,
            category: subcategoryImages[0].categoryName,
            images: images.map(img => ({
                ...img,
                url: useCdn ? img.urls.cdn : img.urls.github,
                thumbnail: img.urls.thumbnail
            })),
            range: {
                start,
                end,
                count: images.length,
                has_more: end < subcategoryImages.length,
                total_in_subcategory: subcategoryImages.length
            }
        };
    }

    // 清理缓存
    clearCache() {
        this.categoryCache = null;
        this.imageIndexCache = null;
        this.cacheTimestamp = null;
    }
}

// 创建单例实例
const animalManager = new AnimalManager();

// 可选：定期清理缓存
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        if (animalManager.cacheTimestamp &&
            (now - animalManager.cacheTimestamp) > animalManager.cacheTTL) {
            animalManager.clearCache();
        }
    }, 60 * 60 * 1000); // 每小时检查一次
}

module.exports = animalManager;