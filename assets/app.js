import { createApp, ref, computed, onMounted, onBeforeUnmount } from './vue.esm-browser.prod.js'

/* ---------- 数据 ---------- */

const SERVICES = [
  {
    id: 'theseus',
    mark: 'TH',
    name: 'Theseus',
    desc: '在线编程训练与判题平台',
    href: 'https://theseus.los-theseus.site/',
    tag: 'theseus',
    port: 8080,
    feature: true
  },
  {
    id: 'forus',
    mark: 'FO',
    name: 'Forus',
    desc: '我们的家站',
    href: 'https://forus.los-theseus.site/',
    tag: 'forus',
    port: 8081
  },
  {
    id: 'losnote',
    mark: 'LN',
    name: 'LosNote',
    desc: '笔记与题库',
    href: 'https://losnote.los-theseus.site/',
    tag: 'losnote',
    port: 8787
  },
  {
    id: 'vesta',
    mark: 'VE',
    name: '大学现状自评',
    desc: '自评问卷与咨询',
    href: 'https://vesta.los-theseus.site/',
    tag: 'vesta',
    port: 8082
  },
  {
    id: 'lospool',
    mark: 'LP',
    name: 'LosPool',
    desc: '多模型路由网关 · API 与管理台',
    href: 'https://pool.los-theseus.site/',
    tag: 'pool',
    port: 8790,
    probe: '/healthz'
  },
  {
    id: 'zywiki',
    mark: 'ZY',
    name: '大学实用就业指南',
    desc: '就业信息差 wiki',
    href: '/zywiki/',
    tag: '/zywiki',
    port: null
  }
]

const PROBE_TIMEOUT = 5000
const PROBE_INTERVAL = 30000

/* ---------- 组件 ---------- */

const StatusChip = {
  props: {
    up: { type: Number, default: null },
    total: { type: Number, required: true }
  },
  template: `
    <span class="chip" :class="{ checking: up === null }" aria-live="polite">
      {{ up === null ? '检测中' : up + '/' + total + ' online' }}
    </span>`
}

const ServiceCard = {
  props: {
    service: { type: Object, required: true },
    status: { type: Object, default: null }
  },
  computed: {
    isUp() {
      return this.status ? this.status.up : null
    },
    dotClass() {
      if (!this.status) return 'dot'
      return 'dot ' + (this.status.up ? 'ok' : 'bad')
    },
    dotTitle() {
      return this.status ? this.status.title : '检测中'
    }
  },
  template: `
    <a class="card" :class="{ feature: service.feature }"
       :href="service.href"
       :target="service.port ? '_blank' : null"
       :rel="service.port ? 'noopener' : null">
      <span class="top">
        <span class="mark">{{ service.mark }}</span>
        <span :class="dotClass" :title="dotTitle" aria-hidden="true"></span>
      </span>
      <span class="name">{{ service.name }}</span>
      <span class="desc">{{ service.desc }}</span>
      <span class="foot">
        <span class="tag">{{ service.tag }}</span>
        <span class="arrow" aria-hidden="true">↗</span>
      </span>
    </a>`
}

/* ---------- 应用 ---------- */

const App = {
  components: { StatusChip, ServiceCard },
  setup() {
    const services = SERVICES
    const statuses = ref({})
    const probing = PROBE_TIMEOUT
    const checkedAt = ref('')
    let timer = null
    let disposed = false

    const targets = SERVICES.filter((s) => s.port)
    const upCount = computed(() =>
      targets.filter((s) => statuses.value[s.id] && statuses.value[s.id].up).length
    )

    const pad = (n) => (n < 10 ? '0' + n : String(n))

    function probeAll() {
      targets.forEach((s) => {
        const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
        const started = typeof performance !== 'undefined' ? performance.now() : Date.now()
        const timerId = setTimeout(() => ctrl && ctrl.abort(), probing)
        const done = (up, title) => {
          clearTimeout(timerId)
          if (disposed) return
          statuses.value = Object.assign({}, statuses.value, {
            [s.id]: { up, title }
          })
        }

        fetch('/_probe/' + s.port + (s.probe || '/'), {
          cache: 'no-store',
          redirect: 'manual',
          signal: ctrl ? ctrl.signal : undefined
        })
          .then((r) => {
            const ms = Math.round(
              (typeof performance !== 'undefined' ? performance.now() : Date.now()) - started
            )
            // redirect:'manual' 时浏览器把 3xx 变成 opaqueredirect（status 0）——端口是活的
            const redirected = r.type === 'opaqueredirect' || r.status === 0
            const up = redirected || r.status < 400
            done(up, (up ? '在线' : '异常 ' + r.status) + ' · ' + ms + ' ms')
          })
          .catch(() => done(false, '离线或超时'))
      })

      setTimeout(() => {
        if (disposed) return
        const d = new Date()
        checkedAt.value = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
      }, probing + 400)
    }

    onMounted(() => {
      probeAll()
      timer = setInterval(probeAll, PROBE_INTERVAL)
      document.addEventListener('visibilitychange', onVisible)
    })

    function onVisible() {
      if (!document.hidden) probeAll()
    }

    onBeforeUnmount(() => {
      disposed = true
      if (timer) clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    })

    return { services, statuses, upCount, probeTotal: targets.length, checkedAt }
  },
  template: `
    <header class="wrap">
      <h1>LosAngelous</h1>
      <p class="kicker">
        <span>portal</span><span class="sep">/</span><span>{{ services.length }} services</span>
        <status-chip :up="upCount" :total="probeTotal" />
      </p>
    </header>

    <main class="wrap">
      <div class="grid">
        <service-card v-for="s in services" :key="s.id" :service="s" :status="statuses[s.id]" />
      </div>
    </main>

    <footer class="wrap">
      <div class="foot-row">
        <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener">浙ICP备2026096838号-1</a>
        <a href="https://github.com/2932238802" target="_blank" rel="noopener">github.com/2932238802</a>
        <span class="spacer"></span>
        <span>{{ checkedAt || '—' }}</span>
      </div>
    </footer>`
}

createApp(App).mount('#app')
