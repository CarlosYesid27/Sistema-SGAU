import { useEffect, useState } from 'react'
import { courseApi, enrollmentApi } from '../services/api'

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const START_HOUR = 6
const END_HOUR = 22
const TOTAL_HOURS = END_HOUR - START_HOUR
const TOTAL_MINUTES = TOTAL_HOURS * 60

// Colors for different courses
const EVENT_COLORS = [
  { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' }, // Blue
  { bg: '#fdf4ff', border: '#d946ef', text: '#86198f' }, // Fuchsia
  { bg: '#ecfdf5', border: '#10b981', text: '#065f46' }, // Emerald
  { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' }, // Amber
  { bg: '#f5f3ff', border: '#8b5cf6', text: '#5b21b6' }, // Violet
  { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' }, // Red
  { bg: '#f0fdf4', border: '#22c55e', text: '#166534' }, // Green
  { bg: '#fff1f2', border: '#f43f5e', text: '#9f1239' }, // Rose
]

export default function ScheduleView({ user, role }) {
  const [courses, setCourses] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSchedule()
  }, [user, role])

  const parseTimeToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  }

  const loadSchedule = async () => {
    setLoading(true)
    setError('')
    try {
      let filteredCourses = []
      
      if (role === 'docente') {
        const res = await courseApi.getAll()
        // Filtrar materias impartidas por este docente
        filteredCourses = res.data.filter(c => c.teacher_id === user.id)
      } else if (role === 'estudiante') {
        const [resCourses, resEnrollments] = await Promise.all([
          courseApi.getAll(),
          enrollmentApi.getMyEnrollments()
        ])
        
        // IDs de materias inscritas activas
        const activeIds = resEnrollments.data
          .filter(e => e.status === 'ENROLLED' || e.status === 'PENDING')
          .map(e => e.course_id)
          
        filteredCourses = resCourses.data.filter(c => activeIds.includes(c.id))
      }
      
      setCourses(filteredCourses)
      
      // Construir eventos para el calendario
      const newEvents = []
      filteredCourses.forEach((c, index) => {
        if (!c.schedule) return
        
        const color = EVENT_COLORS[index % EVENT_COLORS.length]
        const parts = c.schedule.split(',')
        
        parts.forEach(part => {
          const match = part.trim().match(/^([A-Za-záéíóú]+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/i)
          if (match) {
            const dayName = match[1]
            const startStr = match[2]
            const endStr = match[3]
            
            // Normalize day string
            const dayIndex = DAYS.findIndex(d => d.toLowerCase() === dayName.toLowerCase())
            
            if (dayIndex !== -1) {
              const startMin = parseTimeToMinutes(startStr)
              const endMin = parseTimeToMinutes(endStr)
              
              // Only add if it's within our calendar bounds
              if (startMin >= START_HOUR * 60 && endMin <= END_HOUR * 60) {
                // Calculate position relative to the grid
                const topPercent = ((startMin - (START_HOUR * 60)) / TOTAL_MINUTES) * 100
                const heightPercent = ((endMin - startMin) / TOTAL_MINUTES) * 100
                
                newEvents.push({
                  id: `${c.id}-${dayIndex}-${startStr}`,
                  courseName: c.name,
                  day: DAYS[dayIndex],
                  startTime: startStr,
                  endTime: endStr,
                  top: `${topPercent}%`,
                  height: `${heightPercent}%`,
                  color
                })
              }
            }
          }
        })
      })
      
      setEvents(newEvents)
    } catch (err) {
      setError('Error al cargar la información del horario.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Generar etiquetas de tiempo (06:00, 07:00, ...)
  const timeLabels = []
  for (let i = START_HOUR; i < END_HOUR; i++) {
    timeLabels.push(`${i.toString().padStart(2, '0')}:00`)
  }

  if (loading) return <div style={{ padding: '20px', color: '#64748b' }}>Cargando calendario...</div>

  return (
    <div className="schedule-container">
      <div className="schedule-header">
        <div>
          <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '24px' }}>Mi Horario Semanal</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
            {role === 'docente' 
              ? 'Aquí puedes ver el horario de las materias que tienes asignadas para dictar este semestre.'
              : 'Aquí puedes ver de forma gráfica los horarios de todas tus materias inscritas.'}
          </p>
        </div>
      </div>
      
      {error && (
        <div style={{ marginBottom: '20px', padding: '14px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', color: '#991b1b', fontSize: '14px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {courses.length === 0 && !error ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
          No tienes materias asignadas con horarios configurados en el sistema actualmente.
        </div>
      ) : (
        <div className="schedule-grid-wrapper">
          {/* Columna de Horas */}
          <div className="schedule-time-column">
            <div className="schedule-col-header">Hora</div>
            <div style={{ position: 'relative', height: `${TOTAL_HOURS * 60}px` }}>
              {timeLabels.map((time, idx) => (
                <div key={idx} className="schedule-time-label">
                  {time}
                </div>
              ))}
            </div>
          </div>
          
          {/* Columnas de Días */}
          {DAYS.map((day) => {
            const dayEvents = events.filter(e => e.day === day)
            
            return (
              <div key={day} className="schedule-day-column">
                <div className="schedule-col-header">{day}</div>
                <div style={{ position: 'relative', height: `${TOTAL_HOURS * 60}px` }}>
                  {/* Líneas horizontales de fondo */}
                  {timeLabels.map((_, idx) => (
                    <div key={`bg-${idx}`} className="schedule-time-slot"></div>
                  ))}
                  
                  {/* Eventos superpuestos */}
                  <div className="schedule-events-container">
                    {dayEvents.map(event => (
                      <div 
                        key={event.id} 
                        className="schedule-event"
                        style={{
                          top: event.top,
                          height: event.height,
                          backgroundColor: event.color.bg,
                          borderColor: event.color.border,
                          color: event.color.text
                        }}
                      >
                        <div className="schedule-event-title">{event.courseName}</div>
                        <div className="schedule-event-time">
                          {event.startTime} - {event.endTime}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
