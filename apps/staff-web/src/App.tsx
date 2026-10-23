import { useEffect, useState } from "react"
import {
  INITIAL_ROOMS,
  INITIAL_USERS,
  ROLE_LABEL,
  type Patient,
  type Room,
  type User,
} from "./data"
import Login from "./pages/Login"
import NurseDashboard from "./pages/NurseDashboard"
import OpsDashboard from "./pages/OpsDashboard"
import Accounts from "./pages/Accounts"
import DoctorWorkspace from "./pages/DoctorWorkspace"
import Sidebar, { pagesFor, type Page } from "./components/Sidebar"
import Overview from "./pages/admin/Overview"
import Analytics from "./pages/admin/Analytics"
import Resources from "./pages/admin/Resources"
import Roles from "./pages/admin/Roles"
import Config from "./pages/admin/Config"
import AuditLog from "./pages/admin/AuditLog"
import { useAdminStore, type AdminPageProps } from "./admin/store"
import TransferModal from "./components/TransferModal"
import { Toast } from "./components/ui"

export default function App() {
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS)
  const [users, setUsers] = useState<User[]>(INITIAL_USERS)
  const [sessionName, setSessionName] = useState<string | null>(null)
  const [page, setPage] = useState<Page>("ops")
  const [transferOpen, setTransferOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const user = users.find((u) => u.username === sessionName) ?? null
  const admin = useAdminStore(user)

  const updateRoom = (id: string, fn: (r: Room) => Room) =>
    setRooms((rs) => rs.map((r) => (r.id === id ? fn(r) : r)))

  // Move the patient ahead of all non-urgent waiting patients (after earlier urgent ones).
  const prioritize = (roomId: string, patientId: string) => {
    const room = rooms.find((r) => r.id === roomId)!
    const p = room.patients.find((x) => x.id === patientId)!
    updateRoom(roomId, (r) => {
      const rest = r.patients.filter((x) => x.id !== patientId)
      const idx = rest.findIndex((x) => x.status === "waiting" && !x.urgent)
      const moved = { ...p, urgent: true }
      const at = idx === -1 ? rest.length : idx
      return {
        ...r,
        patients: [...rest.slice(0, at), moved, ...rest.slice(at)],
      }
    })
    setToast(`Đã ưu tiên khám số ${p.order} – ${p.name} (${room.short})`)
    admin.log({ action: "queue", entityType: "Phòng khám", entity: room.name, details: `Ưu tiên khám STT ${p.order}` })
  }

  // Move specific waiting patients from one room to another (bulk or single "Đổi phòng").
  const movePatients = (sourceId: string, ids: string[], destId: string) => {
    const src = rooms.find((r) => r.id === sourceId)!
    const dest = rooms.find((r) => r.id === destId)!
    const moving = src.patients.filter((p) => ids.includes(p.id) && p.status === "waiting")
    if (!moving.length) return
    setRooms((rs) =>
      rs.map((r) =>
        r.id === sourceId
          ? { ...r, patients: r.patients.filter((p) => !moving.includes(p)) }
          : r.id === destId
            ? { ...r, patients: [...r.patients, ...moving.map((p) => ({ ...p, transferredFrom: src.short }))] }
            : r,
      ),
    )
    setToast(
      moving.length === 1
        ? `Đã chuyển STT ${moving[0].order} – ${moving[0].name} sang ${dest.short}`
        : `Đã chuyển ${moving.length} bệnh nhân từ ${src.short} sang ${dest.short}`,
    )
    admin.log({ action: "queue", entityType: "Phòng khám", entity: src.name, details: `Chuyển ${moving.length} bệnh nhân sang ${dest.short}` })
  }

  const toggleClosed = (roomId: string) => {
    const r = rooms.find((x) => x.id === roomId)!
    updateRoom(roomId, (x) => ({ ...x, closed: !x.closed }))
    setToast(
      r.closed
        ? `Đã mở lại hàng đợi ${r.short}`
        : `Đã đóng hàng đợi ${r.short}`,
    )
    admin.log({ action: "queue", entityType: "Phòng khám", entity: r.name, details: r.closed ? "Mở lại hàng đợi" : "Đóng hàng đợi" })
  }

  const transfer = (sourceId: string, destIds: string[]) => {
    const src = rooms.find((r) => r.id === sourceId)!
    const moving = src.patients.filter((p) => p.status === "waiting")
    const buckets: Record<string, Patient[]> = Object.fromEntries(
      destIds.map((d) => [d, []]),
    )
    moving.forEach((p, i) =>
      buckets[destIds[i % destIds.length]].push({
        ...p,
        transferredFrom: src.short,
      }),
    )
    setRooms((rs) =>
      rs.map((r) =>
        r.id === sourceId
          ? { ...r, patients: r.patients.filter((p) => p.status !== "waiting") }
          : buckets[r.id]
            ? { ...r, patients: [...r.patients, ...buckets[r.id]] }
            : r,
      ),
    )
    setTransferOpen(false)
    const names = destIds
      .map((d) => rooms.find((r) => r.id === d)!.short)
      .join(", ")
    setToast(
      `Đã chuyển ${moving.length} bệnh nhân từ ${src.short} sang ${names}`,
    )
    admin.log({ action: "queue", entityType: "Phòng khám", entity: src.name, details: `Chuyển ${moving.length} bệnh nhân đang chờ sang ${names}` })
  }

  const saveUser = (u: User, original?: string) => {
    const before = original ? users.find((x) => x.username === original) : undefined
    const roomLabel = (id: string | null) => (id ? (rooms.find((r) => r.id === id)?.name ?? id) : "Toàn viện")
    const changes = before
      ? (
          [
            ["Tên đăng nhập", before.username, u.username],
            ["Họ tên", before.fullName, u.fullName],
            ["Email", before.email, u.email],
            ["Số điện thoại", before.phone, u.phone],
            ["Vai trò", ROLE_LABEL[before.role], ROLE_LABEL[u.role]],
            ["Phòng phụ trách", roomLabel(before.room), roomLabel(u.room)],
          ] as const
        )
          .filter(([, a, b]) => a !== b)
          .map(([field, b, a]) => ({ field, before: b, after: a }))
      : undefined
    admin.log({
      action: before ? "update" : "create",
      entityType: u.role === "patient" ? "Tài khoản bệnh nhân" : "Tài khoản",
      entity: u.username,
      details: before ? "Cập nhật thông tin tài khoản" : `Tạo tài khoản ${ROLE_LABEL[u.role]} · gửi liên kết kích hoạt`,
      changes,
    })
    setUsers((us) =>
      original ? us.map((x) => (x.username === original ? u : x)) : [...us, u],
    )
    if (original && original === sessionName) setSessionName(u.username)
    setToast(
      original
        ? `Đã cập nhật tài khoản ${u.username}`
        : `Đã tạo tài khoản ${u.username}`,
    )
  }

  if (!user)
    return (
      <>
        <Login
          users={users}
          onLogin={(u) => {
            setSessionName(u.username)
            setPage(u.role === "admin" ? "overview" : "ops")
          }}
        />
        <Toast message={toast} />
      </>
    )

  const logout = () => {
    setSessionName(null)
    setTransferOpen(false)
  }

  if (user.role === "doctor") {
    const room = rooms.find((r) => r.id === user.room) ?? rooms[0]
    return (
      <>
        <DoctorWorkspace
          user={user}
          room={room}
          nurses={users.filter((u) => u.role === "nurse" && u.room === room.id && u.status === "active")}
          onUpdateRoom={updateRoom}
          notify={setToast}
          onLogout={logout}
        />
        <Toast message={toast} position="top" />
      </>
    )
  }

  if (user.role === "nurse") {
    const room = rooms.find((r) => r.id === user.room) ?? rooms[0]
    return (
      <>
        <NurseDashboard
          user={user}
          room={room}
          onUpdateRoom={updateRoom}
          onToggleClosed={toggleClosed}
          notify={setToast}
          onLogout={logout}
        />
        <Toast message={toast} />
      </>
    )
  }

  const allowed = pagesFor(user)
  const current: Page = allowed.includes(page) ? page : allowed[0]

  const pageProps: AdminPageProps = {
    user,
    users,
    store: admin,
    roomIds: rooms.map((r) => r.id),
    notify: setToast,
    onLogout: logout,
    onNavigate: setPage,
  }

  const setStatus = (username: string, status: User["status"], reason: string) => {
    setUsers((us) => us.map((u) => (u.username === username ? { ...u, status } : u)))
    admin.log({
      action: status === "locked" ? "lock" : "unlock",
      entityType: "Tài khoản",
      entity: username,
      details: status === "locked" ? `Khóa tài khoản · ${reason}` : "Mở khóa tài khoản",
      changes: [{ field: "Trạng thái", before: status === "locked" ? "Hoạt động" : "Đã khóa", after: status === "locked" ? "Đã khóa" : "Hoạt động" }],
    })
    setToast(status === "locked" ? `Đã khóa tài khoản ${username}` : `Đã mở khóa tài khoản ${username}`)
  }

  return (
    <div className="flex min-h-screen min-w-[1280px]">
      <Sidebar user={user} page={current} onNavigate={setPage} onLogout={logout} />
      {current === "ops" && (
        <OpsDashboard
          rooms={rooms}
          users={users}
          onPrioritize={prioritize}
          onUpdateRoom={updateRoom}
          onMovePatients={movePatients}
          onOpenTransfer={() => setTransferOpen(true)}
          notify={setToast}
        />
      )}
      {current === "overview" && <Overview {...pageProps} />}
      {current === "analytics" && <Analytics {...pageProps} />}
      {current === "resources" && <Resources {...pageProps} />}
      {current === "roles" && <Roles {...pageProps} />}
      {current === "config" && <Config {...pageProps} />}
      {current === "audit" && <AuditLog {...pageProps} />}
      {current === "accounts" && (
        <Accounts
          {...pageProps}
          rooms={rooms}
          onSave={saveUser}
          onSetStatus={setStatus}
          onCredentialReset={(name, channel, revoke) => {
            admin.log({
              action: "credential",
              entityType: "Tài khoản",
              entity: name,
              details: `Gửi ${channel === "email" ? "liên kết đặt lại qua email" : "mã OTP qua SMS"}${revoke ? " · đăng xuất mọi phiên" : ""}`,
            })
            setToast(`Đã gửi yêu cầu khôi phục truy cập cho ${name} (mô phỏng)`)
          }}
        />
      )}
      {transferOpen && (
        <TransferModal
          rooms={rooms}
          onClose={() => setTransferOpen(false)}
          onConfirm={transfer}
        />
      )}
      <Toast message={toast} />
    </div>
  )
}
