import { useEffect, useState, useCallback } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Calendar as CalendarIcon,
  Gift,
  BookOpen,
  Star,
  AlertCircle,
  PartyPopper,
  Plus,
  Pencil,
  Trash2,
  Sun,
  Info,
  Tag,
} from "lucide-react";
import enIN from "date-fns/locale/en-IN";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";

const locales = { "en-IN": enIN };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const EVENT_TYPE = {
  birthday: {
    color: "#FFB259", // orange
    icon: <PartyPopper className="inline w-4 h-4 mr-2" />,
  },
  exam: {
    color: "#4353FF", // blue
    icon: <BookOpen className="inline w-4 h-4 mr-2" />,
  },
  assignment: {
    color: "#6C5DD3", // purple
    icon: <Star className="inline w-4 h-4 mr-2" />,
  },
  holiday: {
    color: "#38CB89", // green
    icon: <Sun className="inline w-4 h-4 mr-2" />,
  },
  general: {
    color: "#F15550", // red
    icon: <Info className="inline w-4 h-4 mr-2" />,
  },
  custom: {
    color: "#FF7D87", // pink
    icon: <Tag className="inline w-4 h-4 mr-2" />,
  },
};

const defaultEvent = {
  title: "",
  type: "general",
  description: "",
  start: new Date(),
  end: new Date(),
};

const EventModal = ({ event, onClose, onSave, onDelete, isAdmin, isEdit }) => {
  const [form, setForm] = useState(event || defaultEvent);
  const [customType, setCustomType] = useState("");
  useEffect(() => {
    setForm(event || defaultEvent);
    setCustomType(event?.type === "custom" ? event.title : "");
  }, [event]);
  if (!event) return null;
  const type = EVENT_TYPE[form.type] || EVENT_TYPE.general;
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (name === "type" && value === "custom") {
      setCustomType("");
      setForm((f) => ({ ...f, title: "" }));
    }
  };
  const handleDateChange = (name, date) => {
    setForm((f) => ({ ...f, [name]: date }));
  };
  const handleCustomTypeChange = (e) => {
    setCustomType(e.target.value);
    setForm((f) => ({ ...f, title: e.target.value, type: "custom" }));
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-surface rounded-lg shadow-2xl p-6 w-full max-w-lg relative border border-border">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <div className="flex items-center">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center ${type.color} text-white mr-3`}
            >
              {/* Removed icon as per edit hint */}
            </span>
            <h2 className="text-xl font-bold text-text-primary">
              {isEdit ? "Edit Event" : "Add Event"}
            </h2>
          </div>
          <button
            className="text-text-secondary hover:text-accent"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
        >
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Title
            </label>
            {form.type === "custom" ? (
              <input
                className="input"
                name="customType"
                value={customType}
                onChange={handleCustomTypeChange}
                disabled={!isAdmin}
                required
                placeholder="Enter custom event name"
              />
            ) : (
              <input
                className="input"
                name="title"
                value={form.title}
                onChange={handleChange}
                disabled={!isAdmin}
                required
                placeholder="e.g., Final Exams"
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Start Date & Time
              </label>
              <DatePicker
                selected={form.start}
                onChange={(date) => handleDateChange("start", date)}
                selectsStart
                startDate={form.start}
                endDate={form.end}
                showTimeSelect
                dateFormat="MMM d, yyyy h:mm aa"
                disabled={!isAdmin}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                End Date & Time
              </label>
              <DatePicker
                selected={form.end}
                onChange={(date) => handleDateChange("end", date)}
                selectsEnd
                startDate={form.start}
                endDate={form.end}
                minDate={form.start}
                showTimeSelect
                dateFormat="MMM d, yyyy h:mm aa"
                disabled={!isAdmin}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Event Type
            </label>
            <select
              className="input"
              name="type"
              value={form.type}
              onChange={handleChange}
              disabled={!isAdmin}
            >
              {Object.keys(EVENT_TYPE).map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Description
            </label>
            <textarea
              className="input"
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              disabled={!isAdmin}
              placeholder="Add more details about the event..."
            />
          </div>

          {isAdmin && (
            <div className="event-modal-actions flex gap-4 pt-4 border-t border-border mt-2">
              <button
                type="button"
                className="btn btn-secondary flex-1"
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                <Pencil className="w-4 h-4 mr-2" />
                {isEdit ? "Save Changes" : "Create Event"}
              </button>
              {isEdit && (
                <button
                  type="button"
                  className="btn btn-destructive"
                  onClick={() => onDelete(form)}
                  title="Delete Event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

const CalendarPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'view'
  const [loading, setLoading] = useState(true);
  // slotInfo removed (was unused)

  // Fetch events from backend
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/events");
      setEvents(
        response.data.map((e) => ({
          ...e,
          id: e._id, // Ensure every event has an id property for react-big-calendar
          start: new Date(e.start),
          end: new Date(e.end),
        }))
      );
    } catch {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Add event
  const handleAddEvent = async (event) => {
    try {
      await api.post("/events", {
        ...event,
        start:
          event.start instanceof Date ? event.start.toISOString() : event.start,
        end: event.end instanceof Date ? event.end.toISOString() : event.end,
      });
      toast.success("Event added");
      setSelectedEvent(null);
      setModalMode(null);
      fetchEvents();
    } catch {
      toast.error("Failed to add event");
    }
  };

  // Edit event
  const handleEditEvent = async (event) => {
    try {
      await api.put(`/events/${event.id}`, {
        ...event,
        start:
          event.start instanceof Date ? event.start.toISOString() : event.start,
        end: event.end instanceof Date ? event.end.toISOString() : event.end,
      });
      toast.success("Event updated");
      setSelectedEvent(null);
      setModalMode(null);
      fetchEvents();
    } catch {
      toast.error("Failed to update event");
    }
  };

  // Delete event
  const handleDeleteEvent = async (event) => {
    try {
      await api.delete(`/events/${event.id}`);
      toast.success("Event deleted");
      setSelectedEvent(null);
      setModalMode(null);
      fetchEvents();
    } catch {
      toast.error("Failed to delete event");
    }
  };

  // Drag and drop event
  const handleEventDrop = async ({ event, start, end }) => {
    if (!isAdmin) return;
    try {
      await api.put(`/events/${event.id}`, {
        ...event,
        start: start instanceof Date ? start.toISOString() : start,
        end: end instanceof Date ? end.toISOString() : end,
      });
      toast.success("Event rescheduled");
      fetchEvents();
    } catch {
      toast.error("Failed to move event");
    }
  };

  // Double click slot to add event (admin only)
  const handleDoubleClickSlot = (slot) => {
    if (!isAdmin) return;
    setSelectedEvent({ ...defaultEvent, start: slot.start, end: slot.end });
    setModalMode("add");
  };

  // Click event
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setModalMode(isAdmin ? "edit" : "view");
  };

  if (loading) return <LoadingSpinner className="h-64" />;

  const calendarProps = {
    localizer,
    events,
    startAccessor: "start",
    endAccessor: "end",
    style: { height: 600 },
    popup: true,
    selectable: isAdmin,
    onSelectEvent: handleSelectEvent,
    onDoubleClickEvent: handleSelectEvent,
    onDoubleClickSlot: isAdmin ? handleDoubleClickSlot : undefined,
    eventPropGetter: (event) => {
      const type = EVENT_TYPE[event.type] || EVENT_TYPE.general;
      let dataType = "";
      if (event.type === "exam") dataType = "teal";
      else if (event.type === "assignment") dataType = "purple";
      else if (event.type === "holiday") dataType = "green";
      else if (event.type === "custom") dataType = "pink";
      else if (event.type === "birthday") dataType = "orange";
      else if (event.type === "general") dataType = "red";
      return {
        className: `event-modern-rect subtle`,
        style: {
          background: type.color,
          color: "#fff",
          fontWeight: 500,
          fontSize: "1rem",
          borderRadius: "6px",
          boxShadow: "none",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          minHeight: "28px",
          textAlign: "left",
          padding: "4px 14px",
          margin: "3px 0",
          letterSpacing: "0.01em",
          textTransform: "none",
        },
        "data-type": dataType,
      };
    },
    components: {
      event: ({ event }) => {
        const type = EVENT_TYPE[event.type] || EVENT_TYPE.general;
        let dataType = "";
        if (event.type === "exam") dataType = "teal";
        else if (event.type === "assignment") dataType = "purple";
        else if (event.type === "holiday") dataType = "green";
        else if (event.type === "custom") dataType = "pink";
        else if (event.type === "birthday") dataType = "orange";
        else if (event.type === "general") dataType = "red";
        return (
          <span
            className="flex items-center text-white font-medium event-modern-rect"
            data-type={dataType}
            style={{
              fontWeight: 500,
              fontSize: "1rem",
              textTransform: "none",
              width: "100%",
              textAlign: "left",
            }}
          >
            {type.icon}
            <span className="truncate">{event.title}</span>
          </span>
        );
      },
    },
    onSelectSlot: isAdmin ? handleDoubleClickSlot : undefined,
    draggableAccessor: () => isAdmin,
    resizable: isAdmin,
    onEventDrop: isAdmin ? handleEventDrop : undefined,
    onEventResize: isAdmin ? handleEventDrop : undefined,
  };

  const DnDCalendar = withDragAndDrop(BigCalendar);

  return (
    <div className="w-full min-h-[80vh] bg-background px-2 md:px-8 py-8">
      <div className="flex items-center mb-6">
        <CalendarIcon className="w-8 h-8 text-accent mr-3" />
        <h1 className="text-2xl font-bold text-text-primary">
          Calendar & Events
        </h1>
        {isAdmin && (
          <button
            className="ml-auto btn btn-primary flex items-center p-2"
            onClick={() => {
              setSelectedEvent(defaultEvent);
              setModalMode("add");
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Event
          </button>
        )}
      </div>
      <div className="bg-surface border border-border rounded-lg shadow-sm p-4 md:p-8">
        {isAdmin ? (
          <DndProvider backend={HTML5Backend}>
            <DnDCalendar {...calendarProps} draggableAccessor={() => true} />
          </DndProvider>
        ) : (
          <BigCalendar {...calendarProps} />
        )}
      </div>
      <EventModal
        event={selectedEvent}
        onClose={() => {
          setSelectedEvent(null);
          setModalMode(null);
        }}
        onSave={modalMode === "add" ? handleAddEvent : handleEditEvent}
        onDelete={handleDeleteEvent}
        isAdmin={isAdmin && modalMode !== "view"}
        isEdit={modalMode === "edit"}
      />
    </div>
  );
};

export default CalendarPage;
