import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function HeroCanvas3D() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const W = () => el.clientWidth || window.innerWidth
    const H = () => el.clientHeight || window.innerHeight

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(W(), H())
    renderer.setClearColor(0x080808, 1)
    renderer.shadowMap.enabled = true
    el.appendChild(renderer.domElement)

    // Scene
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x080808, 0.014)

    // Camera
    const camera = new THREE.PerspectiveCamera(65, W() / H(), 0.1, 600)
    camera.position.set(0, 6, 38)
    camera.lookAt(0, 0, 0)

    // Lights
    scene.add(new THREE.AmbientLight(0x64748b, 0.15))
    const l1 = new THREE.PointLight(0xd4af37, 6, 150)
    l1.position.set(30, 35, 25)
    scene.add(l1)
    const l2 = new THREE.PointLight(0xfaf9f6, 6, 150)
    l2.position.set(-30, -25, 20)
    scene.add(l2)
    const l3 = new THREE.PointLight(0x64748b, 4, 100)
    l3.position.set(0, -35, 15)
    scene.add(l3)

    // Main wireframe icosphere
    const icoGeo = new THREE.IcosahedronGeometry(14, 4)
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      wireframe: true,
      opacity: 0.1,
      transparent: true,
    })
    const ico = new THREE.Mesh(icoGeo, icoMat)
    scene.add(ico)

    // Inner emissive shell
    const shellGeo = new THREE.IcosahedronGeometry(13.5, 4)
    const shellMat = new THREE.MeshPhongMaterial({
      color: 0x080808,
      emissive: 0xd4af37,
      emissiveIntensity: 0.06,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide,
    })
    const shell = new THREE.Mesh(shellGeo, shellMat)
    scene.add(shell)

    // Torus knot
    const tkGeo = new THREE.TorusKnotGeometry(6.5, 0.45, 128, 16)
    const tkMat = new THREE.MeshBasicMaterial({
      color: 0x64748b,
      wireframe: true,
      opacity: 0.28,
      transparent: true,
    })
    const tk = new THREE.Mesh(tkGeo, tkMat)
    scene.add(tk)

    // Second smaller torus knot (different params)
    const tk2Geo = new THREE.TorusKnotGeometry(9, 0.25, 80, 12, 3, 5)
    const tk2Mat = new THREE.MeshBasicMaterial({
      color: 0xfaf9f6,
      wireframe: true,
      opacity: 0.18,
      transparent: true,
    })
    const tk2 = new THREE.Mesh(tk2Geo, tk2Mat)
    scene.add(tk2)

    // Orbiting rings
    const RING_DATA = [
      { r: 11, color: 0xd4af37, ox: 0, oz: 0.4 },
      { r: 16, color: 0x64748b, ox: 0.6, oz: 0.2 },
      { r: 20, color: 0xfaf9f6, ox: 1.1, oz: 0.8 },
    ]
    const rings = RING_DATA.map(({ r, color, ox, oz }) => {
      const geo = new THREE.TorusGeometry(r, 0.04, 6, 120)
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3 })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.rotation.x = Math.PI / 2 + ox
      mesh.rotation.z = oz
      scene.add(mesh)
      return mesh
    })

    // Octahedra shards
    const SHARD_COUNT = 120
    const shards = Array.from({ length: SHARD_COUNT }, () => {
      const size = Math.random() * 0.75 + 0.15
      const geo = new THREE.OctahedronGeometry(size, 0)
      const col = [0xd4af37, 0x64748b, 0xfaf9f6][Math.floor(Math.random() * 3)]
      const mat = new THREE.MeshBasicMaterial({
        color: col,
        wireframe: true,
        opacity: 0.4 + Math.random() * 0.5,
        transparent: true,
      })
      const m = new THREE.Mesh(geo, mat)
      m.position.set(
        (Math.random() - 0.5) * 110,
        (Math.random() - 0.5) * 90,
        (Math.random() - 0.5) * 60 - 5,
      )
      scene.add(m)
      return {
        m,
        vx: (Math.random() - 0.5) * 0.045,
        vy: (Math.random() - 0.5) * 0.035,
        vz: (Math.random() - 0.5) * 0.02,
        rx: (Math.random() - 0.5) * 0.03,
        ry: (Math.random() - 0.5) * 0.03,
      }
    })

    // Stars
    const starGeo = new THREE.BufferGeometry()
    const starArr = new Float32Array(3000 * 3)
    for (let i = 0; i < 3000; i++) {
      starArr[i * 3] = (Math.random() - 0.5) * 500
      starArr[i * 3 + 1] = (Math.random() - 0.5) * 500
      starArr[i * 3 + 2] = (Math.random() - 0.5) * 500 - 80
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starArr, 3))
    const starMat = new THREE.PointsMaterial({ color: 0xfaf9f6, size: 0.25, transparent: true, opacity: 0.45 })
    scene.add(new THREE.Points(starGeo, starMat))

    // Grid floor
    const grid = new THREE.GridHelper(300, 60, 0xd4af37, 0x101012)
    const gridMats = Array.isArray(grid.material) ? grid.material : [grid.material]
    gridMats.forEach(m => { m.opacity = 0.09; m.transparent = true })
    grid.position.y = -28
    scene.add(grid)

    // Camera parallax state
    let mx = 0, my = 0, camX = 0, camY = 6

    const onMouse = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2
      my = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma != null) mx = Math.max(-1, Math.min(1, e.gamma / 40))
      if (e.beta != null) my = Math.max(-1, Math.min(1, -((e.beta ?? 45) - 45) / 40))
    }
    const onResize = () => {
      camera.aspect = W() / H()
      camera.updateProjectionMatrix()
      renderer.setSize(W(), H())
    }

    window.addEventListener('mousemove', onMouse)
    window.addEventListener('deviceorientation', onTilt, { passive: true })
    window.addEventListener('resize', onResize)

    let t = 0, raf = 0

    const animate = () => {
      raf = requestAnimationFrame(animate)
      t += 0.004

      // Rotate main structures
      ico.rotation.x = t * 0.07
      ico.rotation.y = t * 0.12
      shell.rotation.x = t * 0.07
      shell.rotation.y = t * 0.12
      tk.rotation.x = t * 0.14
      tk.rotation.y = t * 0.21
      tk2.rotation.x = -t * 0.09
      tk2.rotation.z = t * 0.13

      // Rings orbit
      rings.forEach((r, i) => {
        r.rotation.z += 0.003 + i * 0.0015
        r.rotation.x += 0.0008 + i * 0.0005
      })

      // Shards drift
      shards.forEach(s => {
        s.m.position.x += s.vx
        s.m.position.y += s.vy
        s.m.position.z += s.vz
        s.m.rotation.x += s.rx
        s.m.rotation.y += s.ry
        if (Math.abs(s.m.position.x) > 55) s.vx *= -1
        if (Math.abs(s.m.position.y) > 45) s.vy *= -1
        if (s.m.position.z > 35 || s.m.position.z < -55) s.vz *= -1
      })

      // Smooth camera parallax
      camX += (mx * 8 - camX) * 0.025
      camY += (my * 5 + 6 - camY) * 0.025
      camera.position.x = camX
      camera.position.y = camY
      camera.lookAt(0, 0, 0)

      // Pulse lights
      l1.intensity = 5 + Math.sin(t * 2.3) * 1.5
      l2.intensity = 5 + Math.cos(t * 1.8) * 1.5
      l3.intensity = 3 + Math.sin(t * 3.1) * 0.8

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('deviceorientation', onTilt)
      window.removeEventListener('resize', onResize)
      // Dispose
      ;[icoGeo, shellGeo, tkGeo, tk2Geo, starGeo].forEach(g => g.dispose())
      ;[icoMat, shellMat, tkMat, tk2Mat, starMat].forEach(m => m.dispose())
      shards.forEach(s => { s.m.geometry.dispose(); ;(s.m.material as THREE.Material).dispose() })
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />
}
