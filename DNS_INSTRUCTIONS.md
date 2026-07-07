# 🌐 Instrucciones de Configuración DNS

Panel de Gestión Arena13 - Configuración de dominios para GitHub Pages

---

## 📍 Punto de Partida

Estas instrucciones te guían en la configuración de los registros DNS necesarios para que el panel de gestión esté disponible en:
- **panel.arenatrece.com** (Subdominio recomendado)

---

## 🔍 Registrar el Dominio en GitHub

### Paso 1: Acceder a la Configuración

1. Ve a tu repositorio en GitHub: `github.com/arenatrece/panel`
2. Navega a: **Settings** → **Pages**
3. En "Custom domain", introduce: `panel.arenatrece.com`
4. Haz clic en **Save**

### Paso 2: Verificar Dominio

GitHub te proporcionará un registro TXT para verificar que eres el propietario del dominio:
```
Tipo: TXT
Nombre: _github-challenge-panel-arenatrece
Valor: [código proporcionado por GitHub]
TTL: 3600
```

---

## ⚙️ Configurar Registros DNS

### En tu Registrador (Donde compraste arenatrece.com)

Busca la sección de **Gestión DNS** o **DNS Management** y configura lo siguiente:

### Registro CNAME (Recomendado - Subdominio)

Para usar `panel.arenatrece.com`:

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| CNAME | panel | arenatrece.github.io | 3600 |

### Opción Alternativa: Registro A (Dominio raíz)

Si quisieras usar directamente `arenatrece.com` para el panel:

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| A | @ | 185.199.108.153 | 3600 |
| A | @ | 185.199.109.153 | 3600 |
| A | @ | 185.199.110.153 | 3600 |
| A | @ | 185.199.111.153 | 3600 |

---

## ✅ Verificación y HTTPS

### Paso 1: Esperar Propagación DNS

Los cambios DNS pueden tardar entre **10 minutos y 48 horas** en propagarse. Usualmente es rápido (5-30 minutos).

Verifica la propagación con:
```bash
# En Windows PowerShell
Resolve-DnsName panel.arenatrece.com

# O en línea: https://dnschecker.org/
```

### Paso 2: Habilitar HTTPS

1. Vuelve a **GitHub Pages** → **Settings** → **Pages**
2. En "Custom domain", activa **"Enforce HTTPS"**
3. GitHub emitirá automáticamente un certificado SSL Let's Encrypt (puede tardar 24h)

---

## 🎯 Arquitectura Recomendada

```
arenatrece.com          → Sitio principal (Web/Portfolio)
panel.arenatrece.com    → Panel de gestión (Este proyecto)
app.arenatrece.com      → Aplicaciones futuras
api.arenatrece.com      → APIs futuras
```

---

## 🚨 Solución de Problemas

### El dominio no funciona:

1. **Verifica los registros DNS**: Usa https://dnschecker.org/
2. **Confirma el registro TXT de verificación** de GitHub
3. **Revisa los logs de deploy** en GitHub → Actions

### HTTPS no se activa:

1. Asegúrate de que el registro DNS está correctamente propagado
2. Verifica que no hay un certificado SSL conflictivo en tu registrador
3. Espera hasta 24h para que Let's Encrypt emita el certificado

### Redirecciones no funcionan:

Para redirigir `www.arenatrece.com` → `arenatrece.com`, añade:

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| CNAME | www | arenatrece.github.io | 3600 |

---

## 📚 Referencias de Registradores Comunes

### Namecheap
1. **Domain List** → **Manage** → **Advanced DNS**
2. Añade el registro CNAME
3. Guarda cambios

### GoDaddy
1. **DNS Management** → **Records**
2. Añade el registro CNAME
3. Guarda cambios

### Cloudflare
1. **DNS** → **Records**
2. Añade el registro CNAME
3. Configura **Proxy status** = DNS only (nube gris)

---

## 🔄 Workflow de Actualización

```
┌─────────────────────────────────────────────────────────────┐
│  Ciclo de Desarrollo y Despliegue                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Desarrollar localmente                                  │
│     npm run dev                                              │
│                                                              │
│  2. Hacer commit y push                                     │
│     git add . && git commit -m "mensaje"                     │
│     git push main                                            │
│                                                              │
│  3. GitHub Actions se activa automáticamente               │
│     (Ver pestaña "Actions" en el repo)                      │
│                                                              │
│  4. Panel actualizado en:                                   │
│     https://panel.arenatrece.com                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 💾 Backup y Seguridad

### Recomendaciones:

1. **Habilitar 2FA** en tu cuenta de GitHub
2. **Habilitar 2FA** en tu registrador de dominios
3. **Guardar copia** de los registros DNS en lugar seguro
4. **Configurar alertas** de cambios DNS

---

## 📞 Soporte

Si encuentras problemas:

- **GitHub Pages Docs**: https://docs.github.com/pages
- **Supabase Docs**: https://supabase.com/docs
- **Este proyecto**: Revisa `.github/workflows/deploy.yml`

---

*Documento generado para Arena13 Panel de Gestión*
*Última actualización: 2025-01-21*
