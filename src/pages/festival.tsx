import { useState, useEffect, useRef } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import { collection, addDoc, getDocs, query, where, Timestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AppLayout from "@/components/layout/app-layout";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { FIRESTORE_COLLECTIONS } from "@/lib/firestore";

type FestivalEvent = {
  id: string;
  date: Date;
  title: string;
  message: string;
  createdAt: Date;
};

export default function Festival() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [currentEvent, setCurrentEvent] = useState<FestivalEvent | null>(null);
  const [allEvents, setAllEvents] = useState<FestivalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{ id: string, title: string } | null>(null);
  const isEditingRef = useRef(false);

  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  useEffect(() => {
    fetchAllEvents();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchEventForDate(selectedDate);
    }
  }, [selectedDate]);

  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      toast.loading("Loading all events...");
      
      const querySnapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.FESTIVALS));
      const fetchedEvents: FestivalEvent[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedEvents.push({
          id: doc.id,
          date: data.date.toDate(),
          title: data.title,
          message: data.message,
          createdAt: data.createdAt.toDate(),
        });
      });
      
      setAllEvents(fetchedEvents);
      toast.dismiss();
      toast.success(`Loaded ${fetchedEvents.length} events`);
    } catch (error) {
      console.error("Error fetching all events:", error);
      toast.dismiss();
      toast.error("Failed to fetch events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEventForDate = async (date: Date) => {
    try {
      setLoading(true);
      toast.loading(`Loading event for ${formatDate(date)}...`);
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const q = query(
        collection(db, FIRESTORE_COLLECTIONS.FESTIVALS),
        where("date", ">=", Timestamp.fromDate(startOfDay)),
        where("date", "<=", Timestamp.fromDate(endOfDay))
      );
      
      const querySnapshot = await getDocs(q);
      let fetchedEvent: FestivalEvent | null = null;
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]; // Get only the first event
        const data = doc.data();
        fetchedEvent = {
          id: doc.id,
          date: data.date.toDate(),
          title: data.title,
          message: data.message,
          createdAt: data.createdAt.toDate(),
        };
      }
      
      setCurrentEvent(fetchedEvent);
      toast.dismiss();
      
      if (fetchedEvent && !isEditingRef.current) {
        setIsEditing(false);
        setShowForm(false);
        toast.success(`Found event for ${formatDate(date)}`);
      } else if (!fetchedEvent) {
        setTitle("");
        setMessage("");
        setIsEditing(false);
        setEditingEventId(null);
        setShowForm(true);
        toast.info(`No event found for ${formatDate(date)}. Create a new one!`);
      }
      
    } catch (error) {
      console.error("Error fetching event for date:", error);
      toast.dismiss();
      toast.error("Failed to fetch event for the selected date. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (value: any) => {
    const selectedDate = Array.isArray(value) ? value[0] : value;
    setSelectedDate(selectedDate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }
    
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    
    try {
      setLoading(true);
      
      const eventData = {
        date: Timestamp.fromDate(selectedDate),
        title,
        message,
        createdAt: Timestamp.fromDate(new Date()),
      };
      
      if (isEditing && editingEventId) {
        setLoadingAction('updating');
        toast.loading(`Updating event "${title}"...`);
        
        const eventRef = doc(db, FIRESTORE_COLLECTIONS.FESTIVALS, editingEventId);
        await updateDoc(eventRef, {
          title,
          message,
          updatedAt: Timestamp.fromDate(new Date())
        });
        
        toast.dismiss();
        toast.success(`Event "${title}" updated successfully`);
        
        setShowForm(false);
        setIsEditing(false);
        setEditingEventId(null);
      } else {
        // Check if an event already exists for this date
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        const q = query(
          collection(db, FIRESTORE_COLLECTIONS.FESTIVALS),
          where("date", ">=", Timestamp.fromDate(startOfDay)),
          where("date", "<=", Timestamp.fromDate(endOfDay))
        );
        
        const existingEvents = await getDocs(q);
        
        if (!existingEvents.empty) {
          toast.error("An event already exists for this date. Please choose another date.");
          return;
        }
        
        setLoadingAction('creating');
        toast.loading(`Creating new event "${title}"...`);
        
        await addDoc(collection(db, FIRESTORE_COLLECTIONS.FESTIVALS), eventData);
        
        toast.dismiss();
        toast.success(`New event "${title}" created successfully`);
        
        setTitle("");
        setMessage("");
      }
      
      fetchEventForDate(selectedDate);
      fetchAllEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.dismiss();
      toast.error(isEditing 
        ? "Failed to update event. Please try again." 
        : "Failed to create event. Please try again."
      );
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  const handleEdit = (event: FestivalEvent) => {
    toast.info(`Editing event "${event.title}"`);
    
    setIsEditing(true);
    setEditingEventId(event.id);
    
    setSelectedDate(event.date);
    setTitle(event.title);
    setMessage(event.message);
    setShowForm(true); 
  };

  const handleDeleteClick = (eventId: string, eventTitle: string) => {
    setEventToDelete({ id: eventId, title: eventTitle });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    
    try {
      setLoading(true);
      setLoadingAction('deleting');
      
      toast.loading(`Deleting event "${eventToDelete.title}"...`);
      await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.FESTIVALS, eventToDelete.id));
      
      toast.dismiss();
      toast.success(`Event "${eventToDelete.title}" deleted successfully`);
      
      fetchEventForDate(selectedDate as Date);
      fetchAllEvents();
      
      if (editingEventId === eventToDelete.id) {
        setTitle("");
        setMessage("");
        setIsEditing(false);
        setEditingEventId(null);
        setShowForm(false);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.dismiss();
      toast.error("Failed to delete event. Please try again.");
    } finally {
      setLoading(false);
      setLoadingAction(null);
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const hasEvent = allEvents.some(event => {
        const eventDate = new Date(event.date);
        return (
          eventDate.getDate() === date.getDate() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getFullYear() === date.getFullYear()
        );
      });
      
      return hasEvent ? 'has-event' : null;
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-lg md:text-2xl font-bold mb-2 md:mb-6">Festival Events Calendar</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6">
          <div>
            <Card>
              <CardHeader>
              </CardHeader>
              <CardContent>
                <style dangerouslySetInnerHTML={{ __html: `
                  .has-event {
                    position: relative;
                  }
                  .has-event abbr {
                    position: relative;
                    z-index: 1;
                  }
                  .has-event::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    border: 2px solid #4f46e5;
                    z-index: 0;
                  }
                `}} />
                <Calendar
                  onChange={handleDateChange}
                  value={selectedDate}
                  className={`rounded border p-2 w-full ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                  tileClassName={tileClassName}
                />
              </CardContent>
            </Card>
          </div>

          <div>
            {showForm && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base md:text-xl">
                    {isEditing ? "Edit Festival Event" : "Add New Festival Event"}
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    {isEditing 
                      ? `Editing event for ${selectedDate && formatDate(selectedDate)}`
                      : `Creating event for ${selectedDate && formatDate(selectedDate)}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 md:p-6">
                  <form onSubmit={handleSubmit} className="space-y-2 md:space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-xs md:text-sm font-medium mb-1">
                        Title
                      </label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter event title"
                        required
                        disabled={loading}
                        className="text-xs md:text-base"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-xs md:text-sm font-medium mb-1">
                        Message
                      </label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter event message"
                        rows={4}
                        disabled={loading}
                        className="text-xs md:text-base"
                      />
                    </div>
                    
                    <Button type="submit" disabled={loading} className="text-xs md:text-base px-2 md:px-4 py-1 md:py-2">
                      {loadingAction === 'updating' ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : loadingAction === 'creating' ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : isEditing ? (
                        "Update Event"
                      ) : (
                        "Save Event"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        <div className="mt-8">
          {loading && !currentEvent ? (
            <div className="text-center py-4 md:py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-xs md:text-base">Loading event...</p>
            </div>
          ) : (
            <>
              <h2 className="text-base md:text-xl font-semibold mb-4">
                {!currentEvent
                  ? "No event found for selected date"
                  : `Event for ${selectedDate ? formatDate(selectedDate!) : "selected date"}`}
              </h2>
              
              {currentEvent && (
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg md:text-xl">{currentEvent.title}</CardTitle>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEdit(currentEvent)}
                          className="h-8 px-2"
                          disabled={loading}
                        >
                          {loadingAction === 'updating' && editingEventId === currentEvent.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Pencil className="h-4 w-4 mr-1" />
                              Edit
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(currentEvent.id, currentEvent.title)}
                          className="h-8 px-2"
                          disabled={loading}
                        >
                          {loadingAction === 'deleting' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="text-sm">
                      {formatDate(currentEvent.date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base text-gray-600 whitespace-pre-wrap">
                      {currentEvent.message}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the event "{eventToDelete?.title}".
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loadingAction === 'deleting'}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={loadingAction === 'deleting'}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {loadingAction === 'deleting' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
} 