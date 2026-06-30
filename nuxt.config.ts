// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },

  modules: ['@nuxt/ui'],

  app: {
    head: {
      title: '书签分析系统',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '书签分析与管理工具' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Outfit:wght@400;500;600;700&family=Poppins:wght@400;500;600&family=Roboto:wght@400;500;700&display=swap'
        }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      baseURL: process.env.NUXT_PUBLIC_BASE_URL || ''
    }
  },

  vite: {
    server: {
      proxy: {
        '/BookMarks': {
          target: 'http://localhost:8000',
          changeOrigin: true
        }
      }
    }
  },

  ui: {
    primary: '#1456f0',
    gray: 'neutral',
    fonts: false
  }
})
