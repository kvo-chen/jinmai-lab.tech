import * as THREE from 'three';

// 粒子模型类型
export type ParticleModelType = 'heart' | 'flower' | 'saturn' | 'buddha' | 'firework';

// 粒子模型配置
export interface ParticleModelConfig {
  size: number;
  detail?: number;
  color?: THREE.Color;
}

// 粒子模型生成器类
export class ParticleModelGenerator {
  // 生成爱心形状
  static generateHeart(config: ParticleModelConfig): THREE.BufferGeometry {
    const { size } = config;
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const segments = 32;

    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      
      // 爱心数学公式
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      
      vertices.push(x * size * 0.05, y * size * 0.05, 0);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }

  // 生成花朵形状
  static generateFlower(config: ParticleModelConfig): THREE.BufferGeometry {
    const { size, detail = 2 } = config;
    const flowerGeometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    
    // 创建多个花瓣
    const petals = 8;
    const radius = size * 0.5;
    
    for (let p = 0; p < petals; p++) {
      const angle = (p / petals) * Math.PI * 2;
      const petalGeometry = new THREE.IcosahedronGeometry(radius, detail);
      
      // 缩放和旋转花瓣
      const matrix = new THREE.Matrix4();
      matrix.makeRotationY(angle);
      matrix.scale(new THREE.Vector3(1, 1.5, 0.5));
      
      // 应用变换并合并顶点
      const petalVertices = petalGeometry.attributes.position.array;
      for (let i = 0; i < petalVertices.length; i += 3) {
        const vertex = new THREE.Vector3(
          petalVertices[i],
          petalVertices[i + 1],
          petalVertices[i + 2]
        );
        vertex.applyMatrix4(matrix);
        vertices.push(vertex.x, vertex.y, vertex.z);
      }
    }
    
    flowerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    flowerGeometry.computeVertexNormals();
    return flowerGeometry;
  }

  // 生成土星形状（球体+光环）
  static generateSaturn(config: ParticleModelConfig): THREE.Group {
    const { size } = config;
    const saturnGroup = new THREE.Group();
    
    // 土星主体
    const sphereGeometry = new THREE.SphereGeometry(size * 0.6, 32, 32);
    const sphere = new THREE.Mesh(sphereGeometry);
    saturnGroup.add(sphere);
    
    // 土星环
    const ringGeometry = new THREE.TorusGeometry(size * 1.2, size * 0.25, 16, 100);
    const ring = new THREE.Mesh(ringGeometry);
    ring.rotation.x = Math.PI / 2;
    saturnGroup.add(ring);
    
    return saturnGroup;
  }

  // 生成佛像形状（简化）
  static generateBuddha(config: ParticleModelConfig): THREE.BufferGeometry {
    const { size } = config;
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    
    // 简化的佛像轮廓 - 上半身坐像
    const segments = 16;
    const height = size * 1.5;
    const width = size * 1.0;
    
    // 身体轮廓
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI;
      const x = Math.cos(t) * width * 0.5;
      const y = (Math.sin(t) - 1) * height * 0.5;
      
      vertices.push(x, y, 0);
      vertices.push(x, y, width * 0.3);
    }
    
    // 头部
    const headRadius = size * 0.3;
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const x = Math.cos(t) * headRadius;
      const z = Math.sin(t) * headRadius;
      
      vertices.push(x, height * 0.3, z);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }

  // 生成烟花形状
  static generateFirework(config: ParticleModelConfig): THREE.BufferGeometry {
    const { size } = config;
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    
    // 爆炸式粒子效果
    const particles = 128;
    
    for (let i = 0; i < particles; i++) {
      const angle1 = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI;
      const distance = Math.random() * size;
      
      // 球坐标系转笛卡尔坐标系
      const x = Math.sin(angle2) * Math.cos(angle1) * distance;
      const y = Math.sin(angle2) * Math.sin(angle1) * distance;
      const z = Math.cos(angle2) * distance;
      
      vertices.push(0, 0, 0); // 中心点
      vertices.push(x, y, z); // 粒子点
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }

  // 根据类型获取模型
  static getModel(
    type: ParticleModelType,
    config: ParticleModelConfig
  ): THREE.BufferGeometry | THREE.Group {
    switch (type) {
      case 'heart':
        return this.generateHeart(config);
      case 'flower':
        return this.generateFlower(config);
      case 'saturn':
        return this.generateSaturn(config);
      case 'buddha':
        return this.generateBuddha(config);
      case 'firework':
        return this.generateFirework(config);
      default:
        return new THREE.SphereGeometry(config.size, 16, 16);
    }
  }

  // 获取模型的默认材质
  static getDefaultMaterial(color: string | THREE.Color): THREE.Material {
    const colorObj = typeof color === 'string' ? new THREE.Color(color) : color;
    
    return new THREE.MeshBasicMaterial({
      color: colorObj,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
  }

  // 获取线框材质
  static getWireframeMaterial(color: string | THREE.Color): THREE.Material {
    const colorObj = typeof color === 'string' ? new THREE.Color(color) : color;
    
    return new THREE.MeshBasicMaterial({
      color: colorObj,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
  }
}

// 粒子模型缓存，用于优化性能
const modelCache = new Map<string, THREE.BufferGeometry | THREE.Group>();

// 获取缓存的模型
export const getCachedModel = (
  type: ParticleModelType,
  config: ParticleModelConfig
): THREE.BufferGeometry | THREE.Group => {
  const cacheKey = `${type}-${config.size}-${config.detail || 0}-${config.color?.getHexString() || 'default'}`;
  
  if (!modelCache.has(cacheKey)) {
    const model = ParticleModelGenerator.getModel(type, config);
    modelCache.set(cacheKey, model);
  }
  
  return modelCache.get(cacheKey)!;
};

// 清空模型缓存
export const clearModelCache = () => {
  modelCache.clear();
};

// 预加载常用模型
export const preloadModels = (types: ParticleModelType[] = ['heart', 'flower', 'saturn', 'buddha', 'firework']) => {
  const sizes = [0.1, 0.5, 1.0];
  
  types.forEach(type => {
    sizes.forEach(size => {
      getCachedModel(type, { size });
    });
  });
};