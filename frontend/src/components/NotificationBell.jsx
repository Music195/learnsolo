import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { fetchJson } from '../api.js'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('read_notifications') || '[]')
    } catch {
      return []
    }
  })
  const menuRef = useRef(null)

  useEffect(() => {
    fetchJson('/api/notifications')
      .then((data) => {
        if (data?.notifications) {
          setNotifications(data.notifications)
        }
      })
      .catch(() => {})
  }, [])

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length

  function markAllAsRead() {
    const allIds = notifications.map((n) => n.id)
    setReadIds(allIds)
    try {
      localStorage.setItem('read_notifications', JSON.stringify(allIds))
    } catch {}
  }

  function handleNotificationClick(id) {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id]
      setReadIds(updated)
      try {
        localStorage.setItem('read_notifications', JSON.stringify(updated))
      } catch {}
    }
    setIsOpen(false)
  }

  return (
    <div className="noti-wrapper" ref={menuRef}>
      <button
        type="button"
        className={`bar-btn bar-noti ${isOpen ? 'active' : ''}`}
        aria-label="Notifications"
        aria-expanded={isOpen}
        title="Notifications from Learn Solo"
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && <span className="noti-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="noti-popover">
          <div className="noti-popover-header">
            <div className="noti-popover-title">
              <i className="fas fa-bullhorn"></i> Announcements
            </div>
            {unreadCount > 0 && (
              <button type="button" className="noti-mark-read" onClick={markAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>

          <div className="noti-list">
            {notifications.length === 0 ? (
              <p className="noti-empty">No announcements yet.</p>
            ) : (
              notifications.map((item) => {
                const isRead = readIds.includes(item.id)
                return (
                  <div
                    key={item.id}
                    className={`noti-item ${isRead ? 'read' : 'unread'}`}
                    onClick={() => handleNotificationClick(item.id)}
                  >
                    <div className="noti-item-head">
                      {!isRead && <span className="noti-dot" title="Unread"></span>}
                      <strong className="noti-item-title">{item.title}</strong>
                      <span className="noti-item-date">{item.date}</span>
                    </div>
                    <p className="noti-item-msg">{item.message}</p>
                    {item.link && (
                      <Link to={item.link} className="noti-item-link">
                        Open page <i className="fas fa-arrow-right"></i>
                      </Link>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
