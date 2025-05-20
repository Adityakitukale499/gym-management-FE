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
  const [events, setEvents] = useState<FestivalEvent[]>([]);
  const [allEvents, setAllEvents] = useState<FestivalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{ id: string, title: string } | null>(null);
  const isEditingRef = useRef(false);

  // Update the ref whenever isEditing changes
  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  // Fetch all events when component mounts
  useEffect(() => {
    fetchAllEvents();
  }, []);

  // Fetch events for selected date
  useEffect(() => {
    if (selectedDate) {
      fetchEventsForDate(selectedDate);
    }
  }, [selectedDate]);

  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      toast.loading("Loading all events...");
      
      const querySnapshot = await getDocs(collection(db, "FESTIVAL"));
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

  const fetchEventsForDate = async (date: Date) => {
    try {
      setLoading(true);
      toast.loading(`Loading events for ${formatDate(date)}...`);
      
      // Start of the selected date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      // End of the selected date
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const q = query(
        collection(db, "FESTIVAL"),
        where("date", ">=", Timestamp.fromDate(startOfDay)),
        where("date", "<=", Timestamp.fromDate(endOfDay))
      );
      
      const querySnapshot = await getDocs(q);
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
      
      setEvents(fetchedEvents);
      toast.dismiss();
      
      // Don't automatically show the form or pre-fill for existing events
      // BUT - don't hide the form if we're explicitly in editing mode
      if (fetchedEvents.length > 0 && !isEditingRef.current) {
        setIsEditing(false); // Reset editing state
        setShowForm(false); // Don't show the form automatically
        toast.success(`Found ${fetchedEvents.length} event(s) for ${formatDate(date)}`);
      } else if (fetchedEvents.length === 0) {
        // For dates without events, allow creating a new event
        setTitle("");
        setMessage("");
        setIsEditing(false);
        setEditingEventId(null);
        setShowForm(true); // Show the form for new events
        toast.info(`No events found for ${formatDate(date)}. Create a new one!`);
      }
      // If we're editing (isEditingRef.current is true), don't change form visibility
      
    } catch (error) {
      console.error("Error fetching events for date:", error);
      toast.dismiss();
      toast.error("Failed to fetch events for the selected date. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (value: any) => {
    const selectedDate = Array.isArray(value) ? value[0] : value;
    setSelectedDate(selectedDate);
    // Don't automatically set showForm to true
    // This will be handled in fetchEventsForDate
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
      
      // If we're editing an existing event
      if (isEditing && editingEventId) {
        setLoadingAction('updating');
        toast.loading(`Updating event "${title}"...`);
        
        const eventRef = doc(db, "FESTIVAL", editingEventId);
        await updateDoc(eventRef, {
          title,
          message,
          updatedAt: Timestamp.fromDate(new Date())
        });
        
        toast.dismiss();
        toast.success(`Event "${title}" updated successfully`);
        
        // Reset form state after update
        setShowForm(false);
        setIsEditing(false);
        setEditingEventId(null);
      } else {
        // Creating a new event
        setLoadingAction('creating');
        toast.loading(`Creating new event "${title}"...`);
        
        await addDoc(collection(db, "FESTIVAL"), eventData);
        
        toast.dismiss();
        toast.success(`New event "${title}" created successfully`);
        
        // Reset form for new event
        setTitle("");
        setMessage("");
      }
      
      // Refresh both event lists
      fetchEventsForDate(selectedDate);
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
    
    // Set editing mode first to prevent form from hiding
    setIsEditing(true);
    setEditingEventId(event.id);
    
    // Then update the date (which will trigger fetchEventsForDate)
    setSelectedDate(event.date);
    setTitle(event.title);
    setMessage(event.message);
    setShowForm(true); // Explicitly show the form
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
      await deleteDoc(doc(db, "FESTIVAL", eventToDelete.id));
      
      toast.dismiss();
      toast.success(`Event "${eventToDelete.title}" deleted successfully`);
      
      // Refresh the events lists
      fetchEventsForDate(selectedDate as Date);
      fetchAllEvents();
      
      // Clear form if we were editing this event
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
  
  // Function to add custom class to dates that have events
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      // Check if the date has any events
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
        <h1 className="text-2xl font-bold mb-6">Festival Events Calendar</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Select Date</CardTitle>
                <CardDescription>Choose a date to view or add festival events</CardDescription>
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
                  <CardTitle>
                    {isEditing ? "Edit Festival Event" : "Add New Festival Event"}
                  </CardTitle>
                  <CardDescription>
                    {isEditing 
                      ? `Editing event for ${selectedDate && formatDate(selectedDate)}`
                      : `Creating event for ${selectedDate && formatDate(selectedDate)}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium mb-1">
                        Title
                      </label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter event title"
                        required
                        disabled={loading}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium mb-1">
                        Message
                      </label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter event details"
                        rows={4}
                        disabled={loading}
                      />
                    </div>
                    
                    <Button type="submit" disabled={loading}>
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
          <Card>
            <CardHeader>
              <CardTitle>Events List</CardTitle>
              <CardDescription>
                {events.length === 0
                  ? "No events found for selected date"
                  : `${events.length} event(s) found for ${selectedDate ? formatDate(selectedDate!) : "selected date"}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && !events.length ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p>Loading events...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      No events found for selected date
                    </p>
                  ) : (
                    events.map((event) => (
                      <div
                        key={event.id}
                        className="p-4 border rounded-lg bg-white hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{event.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDate(event.date)}
                            </p>
                            <p className="mt-2">{event.message}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEdit(event)}
                              className="h-8 px-2"
                              disabled={loading}
                            >
                              {loadingAction === 'updating' && editingEventId === event.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Pencil className="h-4 w-4 mr-1" />
                                
                                </>
                              )}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick(event.id, event.title)}
                              className="h-8 px-2"
                              disabled={loading}
                            >
                              {loadingAction === 'deleting' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-1" />
                                
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Delete Confirmation Dialog */}
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