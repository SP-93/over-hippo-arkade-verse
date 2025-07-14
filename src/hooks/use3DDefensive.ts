import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { safeThreeOperation } from '@/utils/webglContextManager';

/**
 * Defensive 3D operations hook
 * Provides safe wrappers for Three.js operations that can fail
 */
export const use3DDefensive = () => {
  const disposed = useRef(false);

  // Safe Vector3 operations
  const safeVector3 = useCallback((x = 0, y = 0, z = 0): THREE.Vector3 => {
    return safeThreeOperation(
      () => new THREE.Vector3(x, y, z),
      () => new THREE.Vector3(0, 0, 0),
      'Vector3 creation failed'
    ) || new THREE.Vector3(0, 0, 0);
  }, []);

  // Safe position setting
  const safeSetPosition = useCallback((
    object: THREE.Object3D | null | undefined, 
    x: number, 
    y: number, 
    z: number
  ): boolean => {
    if (!object || disposed.current) {
      console.warn('⚠️ Cannot set position: object is null or disposed');
      return false;
    }

    return safeThreeOperation(
      () => {
        // Validate numbers
        const safeX = isFinite(x) ? x : 0;
        const safeY = isFinite(y) ? y : 0;
        const safeZ = isFinite(z) ? z : 0;
        
        object.position.set(safeX, safeY, safeZ);
        return true;
      },
      () => false,
      'Position setting failed'
    ) || false;
  }, []);

  // Safe rotation setting
  const safeSetRotation = useCallback((
    object: THREE.Object3D | null | undefined, 
    x: number, 
    y: number, 
    z: number
  ): boolean => {
    if (!object || disposed.current) {
      console.warn('⚠️ Cannot set rotation: object is null or disposed');
      return false;
    }

    return safeThreeOperation(
      () => {
        // Validate numbers
        const safeX = isFinite(x) ? x : 0;
        const safeY = isFinite(y) ? y : 0;
        const safeZ = isFinite(z) ? z : 0;
        
        object.rotation.set(safeX, safeY, safeZ);
        return true;
      },
      () => false,
      'Rotation setting failed'
    ) || false;
  }, []);

  // Safe scale setting
  const safeSetScale = useCallback((
    object: THREE.Object3D | null | undefined, 
    x: number, 
    y: number, 
    z: number
  ): boolean => {
    if (!object || disposed.current) {
      console.warn('⚠️ Cannot set scale: object is null or disposed');
      return false;
    }

    return safeThreeOperation(
      () => {
        // Validate numbers and prevent zero/negative scales
        const safeX = isFinite(x) && x > 0 ? x : 1;
        const safeY = isFinite(y) && y > 0 ? y : 1;
        const safeZ = isFinite(z) && z > 0 ? z : 1;
        
        object.scale.set(safeX, safeY, safeZ);
        return true;
      },
      () => false,
      'Scale setting failed'
    ) || false;
  }, []);

  // Safe object disposal
  const safeDispose = useCallback((object: THREE.Object3D | null | undefined): void => {
    if (!object) return;

    safeThreeOperation(
      () => {
        // Dispose geometry
        if ('geometry' in object && object.geometry && typeof object.geometry === 'object' && 'dispose' in object.geometry) {
          (object.geometry as any).dispose();
        }

        // Dispose material(s)
        if ('material' in object && object.material) {
          const material = object.material as any;
          if (Array.isArray(material)) {
            material.forEach(mat => {
              if (mat && 'dispose' in mat) {
                mat.dispose();
              }
            });
          } else if ('dispose' in material) {
            material.dispose();
          }
        }

        // Remove from parent
        if (object.parent) {
          object.parent.remove(object);
        }

        return true;
      },
      () => false,
      'Object disposal failed'
    );
  }, []);

  // Safe mesh creation
  const createSafeMesh = useCallback((
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position?: { x: number; y: number; z: number }
  ): THREE.Mesh | null => {
    return safeThreeOperation(
      () => {
        const mesh = new THREE.Mesh(geometry, material);
        
        if (position) {
          safeSetPosition(mesh, position.x, position.y, position.z);
        }
        
        return mesh;
      },
      () => null,
      'Mesh creation failed'
    );
  }, [safeSetPosition]);

  // Safe property access with validation
  const safeGetProperty = useCallback(<T>(
    obj: any,
    path: string,
    defaultValue: T
  ): T => {
    try {
      const keys = path.split('.');
      let current = obj;
      
      for (const key of keys) {
        if (current === null || current === undefined) {
          return defaultValue;
        }
        current = current[key];
      }
      
      return current !== undefined ? current : defaultValue;
    } catch (error) {
      console.warn(`⚠️ Safe property access failed for path "${path}":`, error);
      return defaultValue;
    }
  }, []);

  // Validate Vector3 object
  const isValidVector3 = useCallback((vec: any): vec is THREE.Vector3 => {
    return vec && 
           typeof vec.x === 'number' && isFinite(vec.x) &&
           typeof vec.y === 'number' && isFinite(vec.y) &&
           typeof vec.z === 'number' && isFinite(vec.z);
  }, []);

  // Validate Object3D
  const isValidObject3D = useCallback((obj: any): obj is THREE.Object3D => {
    return obj && 
           obj.position && isValidVector3(obj.position) &&
           obj.rotation && 
           obj.scale && isValidVector3(obj.scale);
  }, [isValidVector3]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disposed.current = true;
    };
  }, []);

  return {
    safeVector3,
    safeSetPosition,
    safeSetRotation,
    safeSetScale,
    safeDispose,
    createSafeMesh,
    safeGetProperty,
    isValidVector3,
    isValidObject3D,
    disposed: () => disposed.current
  };
};