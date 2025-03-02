import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy
} from "firebase/firestore";
import { db } from './firebase'
import { Timestamp } from "firebase/firestore";

// Main App Component
const BadmintonBookingApp = () => {
  // State for sessions and current view
  const [sessions, setSessions] = useState([]);
  const [view, setView] = useState('home'); // home, createSession, bookSlot, sessionDetails
  const [currentSession, setCurrentSession] = useState(null);

  // // Load sessions from localStorage on component mount
  // useEffect(() => {
  //   const savedSessions = localStorage.getItem('badmintonSessions');
  //   if (savedSessions) {
  //     setSessions(JSON.parse(savedSessions));
  //   }
  // }, []);

  // // Save sessions to localStorage whenever they change
  // useEffect(() => {
  //   localStorage.setItem('badmintonSessions', JSON.stringify(sessions));
  // }, [sessions]);

  // Load sessions from Firestore on component mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const sessionsCollection = collection(db, "sessions");
        const sessionsQuery = query(sessionsCollection, orderBy("date"));
        const snapshot = await getDocs(sessionsQuery);
        
        const sessionsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setSessions(sessionsList);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      }
    };

    fetchSessions();
  }, []);

    // // Handle creating a new session
  // const handleCreateSession = (sessionData) => {
  //   const newSession = {
  //     id: Date.now(),
  //     ...sessionData,
  //     slots: [],
  //     totalAmount: 0,
  //     isPaid: false,
  //   };
  //   setSessions([...sessions, newSession]);
  //   setView('home');
  // };

  // Handle creating a new session
  const handleCreateSession = async (sessionData) => {
    try {
      const newSession = {
        ...sessionData,
        slots: [],
        totalAmount: 0,
        isPaid: false,
      };
      
      const docRef = await addDoc(collection(db, "sessions"), newSession);
      
      setSessions([...sessions, {
        id: docRef.id,
        ...newSession
      }]);
      
      setView('home');
    } catch (error) {
      console.error("Error creating session:", error);
      alert("Failed to create session. Please try again.");
    }
  };


  // // Handle booking a slot in a session
  // const handleBookSlot = (sessionId, slotData) => {
  //   setSessions(sessions.map(session => {
  //     if (session.id === sessionId) {
  //       return {
  //         ...session,
  //         slots: [...session.slots, { ...slotData, id: Date.now() }]
  //       };
  //     }
  //     return session;
  //   }));
  //   setView('sessionDetails');
  // };
  
  // Handle booking a slot in a session
  const handleBookSlot = async (sessionId, slotData) => {
    try {
      const sessionRef = doc(db, "sessions", sessionId);
      const sessionToUpdate = sessions.find(s => s.id === sessionId);
      
      if (!sessionToUpdate) return;
      
      const updatedSlots = [...sessionToUpdate.slots, { ...slotData, id: Date.now() }];
      
      await updateDoc(sessionRef, {
        slots: updatedSlots
      });
      
      setSessions(sessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            slots: updatedSlots
          };
        }
        return session;
      }));
      
      setView('sessionDetails');
    } catch (error) {
      console.error("Error booking slot:", error);
      alert("Failed to book slot. Please try again.");
    }
  };

  // const handleCancelBooking = (sessionId, slotId) => {
  //   if (window.confirm("Are you sure you want to cancel this booking?")) {
  //     // Get the player name for the confirmation message
  //     const sessionToUpdate = sessions.find(session => session.id === sessionId);
  //     const slotToCancel = sessionToUpdate?.slots.find(slot => slot.id === slotId);
  //     const playerName = slotToCancel?.playerName || 'Player';
      
  //     // Update sessions state
  //     const updatedSessions = sessions.map(session => {
  //       if (session.id === sessionId) {
  //         // Create updated session with filtered slots
  //         const updatedSession = {
  //           ...session,
  //           slots: session.slots.filter(slot => slot.id !== slotId)
  //         };
  //         return updatedSession;
  //       }
  //       return session;
  //     });
      
  //     // Update the sessions state
  //     setSessions(updatedSessions);
      
  //     // Also update currentSession if it's the one being modified
  //     if (currentSession && currentSession.id === sessionId) {
  //       const updatedCurrentSession = updatedSessions.find(session => session.id === sessionId);
  //       setCurrentSession(updatedCurrentSession);
  //     }
      
  //     // Show confirmation message
  //     alert(`Booking for ${playerName} has been cancelled successfully.`);
  //   }
  // };
  
  // Handle cancelling a booking
  const handleCancelBooking = async (sessionId, slotId) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        const sessionToUpdate = sessions.find(session => session.id === sessionId);
        const slotToCancel = sessionToUpdate?.slots.find(slot => slot.id === slotId);
        const playerName = slotToCancel?.playerName || 'Player';
        
        // Update Firestore
        const sessionRef = doc(db, "sessions", sessionId);
        const updatedSlots = sessionToUpdate.slots.filter(slot => slot.id !== slotId);
        
        await updateDoc(sessionRef, {
          slots: updatedSlots
        });
        
        // Update local state
        const updatedSessions = sessions.map(session => {
          if (session.id === sessionId) {
            return {
              ...session,
              slots: updatedSlots
            };
          }
          return session;
        });
        
        setSessions(updatedSessions);
        
        // Update currentSession if it's the one being modified
        if (currentSession && currentSession.id === sessionId) {
          const updatedCurrentSession = updatedSessions.find(s => s.id === sessionId);
          setCurrentSession(updatedCurrentSession);
        }
        
        alert(`Booking for ${playerName} has been cancelled successfully.`);
      } catch (error) {
        console.error("Error cancelling booking:", error);
        alert("Failed to cancel booking. Please try again.");
      }
    }
  };

  // // Handle deleting a session
  // const handleDeleteSession = (sessionId) => {
  //   if (window.confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
  //     setSessions(sessions.filter(session => session.id !== sessionId));
  //     setView('home');
  //   }
  // };

  // Handle deleting a session
  const handleDeleteSession = async (sessionId) => {
    if (window.confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
      try {
        // Delete from Firestore
        await deleteDoc(doc(db, "sessions", sessionId));
        
        // Update local state
        setSessions(sessions.filter(session => session.id !== sessionId));
        setView('home');
      } catch (error) {
        console.error("Error deleting session:", error);
        alert("Failed to delete session. Please try again.");
      }
    }
  };

  // // Handle finalizing a session with payment info
  // const handleFinalizeSession = (sessionId, totalAmount, individualCosts = null) => {
  //   setSessions(sessions.map(session => {
  //     if (session.id === sessionId) {
  //       // If individual costs are provided, use them
  //       if (individualCosts) {
  //         const totalSlots = session.slots.length;
  //         const costPerPerson = totalSlots > 0 ? 
  //           Object.values(individualCosts).reduce((sum, cost) => sum + cost, 0) / totalSlots : 0;
          
  //         return {
  //           ...session,
  //           totalAmount,
  //           individualCosts,
  //           costPerPerson,
  //           isPaid: true
  //         };
  //       } else {
  //         // Otherwise calculate even split
  //         const costPerPerson = session.slots.length > 0 
  //           ? totalAmount / session.slots.length 
  //           : 0;
          
  //         // Create individual costs object with even distribution
  //         const costs = {};
  //         session.slots.forEach(slot => {
  //           costs[slot.id] = costPerPerson;
  //         });
          
  //         return {
  //           ...session,
  //           totalAmount,
  //           individualCosts: costs,
  //           costPerPerson,
  //           isPaid: true
  //         };
  //       }
  //     }
  //     return session;
  //   }));
    
  //   // Send notification emails (simulated in this version)
  //   console.log("Payment notification emails would be sent here");
  // };

  // Handle finalizing a session with payment info
  const handleFinalizeSession = async (sessionId, totalAmount, individualCosts = null) => {
    try {
      const sessionToUpdate = sessions.find(s => s.id === sessionId);
      
      if (!sessionToUpdate) return;
      
      // Prepare update data
      let updateData = {};
      
      if (individualCosts) {
        const totalSlots = sessionToUpdate.slots.length;
        const costPerPerson = totalSlots > 0 ? 
          Object.values(individualCosts).reduce((sum, cost) => sum + cost, 0) / totalSlots : 0;
        
        updateData = {
          totalAmount,
          individualCosts,
          costPerPerson,
          isPaid: true
        };
      } else {
        // Calculate even split
        const costPerPerson = sessionToUpdate.slots.length > 0 
          ? totalAmount / sessionToUpdate.slots.length 
          : 0;
        
        // Create individual costs object with even distribution
        const costs = {};
        sessionToUpdate.slots.forEach(slot => {
          costs[slot.id] = costPerPerson;
        });
        
        updateData = {
          totalAmount,
          individualCosts: costs,
          costPerPerson,
          isPaid: true
        };
      }
      
      // Update in Firestore
      const sessionRef = doc(db, "sessions", sessionId);
      await updateDoc(sessionRef, updateData);
      
      // Update local state
      setSessions(sessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            ...updateData
          };
        }
        return session;
      }));
      
      // Log notification (in a real app, you would send emails here)
      console.log("Payment notification emails would be sent here");
    } catch (error) {
      console.error("Error finalizing session:", error);
      alert("Failed to finalize session. Please try again.");
    }
  };

  // Render the appropriate view
  const renderView = () => {
    switch (view) {
      case 'createSession':
        return <CreateSessionForm onSubmit={handleCreateSession} onCancel={() => setView('home')} />;
      case 'bookSlot':
        return <BookSlotForm 
          session={currentSession} 
          onSubmit={(slotData) => handleBookSlot(currentSession.id, slotData)} 
          onCancel={() => setView('home')} 
        />;
      case 'sessionDetails':
        return <SessionDetails 
          session={currentSession} 
          onFinalize={(amount, individualCosts) => handleFinalizeSession(currentSession.id, amount, individualCosts)}
          onBack={() => setView('home')}
          onCancelBooking={(slotId) => handleCancelBooking(currentSession.id, slotId)}
          onDeleteSession={() => handleDeleteSession(currentSession.id)}
        />;
      default:
        return <HomePage 
          sessions={sessions} 
          onCreateNew={() => setView('createSession')} 
          onSelectSession={(session) => {
            setCurrentSession(session);
            setView('bookSlot');
          }}
          onViewDetails={(session) => {
            setCurrentSession(session);
            setView('sessionDetails');
          }}
        />;
    }
  };

  return (
  <div className="min-h-screen bg-gray-100 p-2 sm:p-4">
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <header className="bg-blue-600 text-white p-3 sm:p-4">
        <h1 className="text-xl sm:text-2xl font-bold">Badminton Booking</h1>
      </header>
      <main className="p-3 sm:p-4">
        {renderView()}
      </main>
    </div>
  </div>
  );
};

// Home Page Component
const HomePage = ({ sessions, onCreateNew, onSelectSession, onViewDetails }) => {
  const upcomingSessions = sessions.filter(session => new Date(session.date) >= new Date());
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Badminton Sessions</h2>
        <button 
          onClick={onCreateNew}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Create New Session
        </button>
      </div>
      
      {upcomingSessions.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Upcoming Sessions</h3>
          {upcomingSessions.map(session => (
            <div key={session.id} className="border rounded p-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">{new Date(session.date).toLocaleDateString()}</p>
                  <p>{session.startTime} - {session.endTime}</p>
                  <p>{session.courts} courts • {session.slots.length}/{session.maxSlots} slots filled</p>
                  <p className="text-gray-600">{session.location || "NBC Granville"}</p>
                </div>
                <div className="space-x-2">
                  <button 
                    onClick={() => onSelectSession(session)}
                    disabled={session.slots.length >= session.maxSlots}
                    className={`px-3 py-1 rounded text-white ${
                      session.slots.length >= session.maxSlots 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    Book Slot
                  </button>
                  <button 
                    onClick={() => onViewDetails(session)}
                    className="px-3 py-1 rounded bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">No upcoming sessions. Create one to get started!</p>
      )}
      
      {sessions.length > upcomingSessions.length && (
        <div className="mt-8 space-y-4">
          <h3 className="font-medium text-lg">Past Sessions</h3>
          {sessions
            .filter(session => new Date(session.date) < new Date())
            .map(session => (
              <div key={session.id} className="border rounded p-4 bg-gray-50 opacity-75">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold">{new Date(session.date).toLocaleDateString()}</p>
                    <p>{session.startTime} - {session.endTime}</p>
                    <p>{session.courts} courts • {session.slots.length}/{session.maxSlots} slots filled</p>
                    {session.isPaid && session.costPerPerson && (
                      <p className="text-green-600">Paid • ${session.costPerPerson.toFixed(2)}/person</p>
                    )}
                  </div>
                  <button 
                    onClick={() => onViewDetails(session)}
                    className="px-3 py-1 rounded bg-gray-500 hover:bg-gray-600 text-white"
                  >
                    Details
                  </button>
                </div>
              </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Create Session Form Component
const CreateSessionForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    courts: 1,
    maxSlots: 4,
    location: 'NBC Granville', // Default location
    paymentInfo: {
      accountName: '',
      accountNumber: '',
      bank: 'CBA',
      customBank: ''
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Create New Session</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Courts</label>
            <input
              type="number"
              name="courts"
              value={formData.courts}
              onChange={handleChange}
              required
              min="1"
              max="10"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Players</label>
            <input
              type="number"
              name="maxSlots"
              value={formData.maxSlots}
              onChange={handleChange}
              required
              min="1"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="NBC Granville">NBC Granville</option>
              <option value="NBC Yennora">Badminton Worx Yennora</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Payment Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
              <input
                type="text"
                name="paymentInfo.accountName"
                value={formData.paymentInfo.accountName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <input
                type="text"
                name="paymentInfo.accountNumber"
                value={formData.paymentInfo.accountNumber}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
              <select
                name="paymentInfo.bank"
                value={formData.paymentInfo.bank}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="CBA">Commonwealth Bank (CBA)</option>
                <option value="Westpac">Westpac</option>
                <option value="Custom">Other (Custom)</option>
              </select>
            </div>
            {formData.paymentInfo.bank === 'Custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Bank Name</label>
                <input
                  type="text"
                  name="paymentInfo.customBank"
                  value={formData.paymentInfo.customBank}
                  onChange={handleChange}
                  required={formData.paymentInfo.bank === 'Custom'}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter bank name"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Session
          </button>
        </div>
      </form>
    </div>
  );
};

// Book Slot Form Component
const BookSlotForm = ({ session, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    playerName: '',
    email: '',
    startTime: session.startTime,
    endTime: session.endTime,
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const slotsRemaining = session.maxSlots - session.slots.length;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Book a Slot</h2>
      
      <div className="mb-6 bg-blue-50 p-4 rounded-md">
        <p className="font-medium">Session Details:</p>
        <p>Date: {new Date(session.date).toLocaleDateString()}</p>
        <p>Time: {session.startTime} - {session.endTime}</p>
        <p>Location: {session.location || "NBC Granville"}</p>
        <p>Courts: {session.courts}</p>
        <p className="text-green-600 font-medium">
          {slotsRemaining} slot{slotsRemaining !== 1 ? 's' : ''} remaining
        </p>
      </div>
      
      {slotsRemaining > 0 ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input
              type="text"
              name="playerName"
              value={formData.playerName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter your name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address (Optional)</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter your email for payment notifications"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Playing From</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                min={session.startTime}
                max={session.endTime}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Playing Until</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                min={formData.startTime}
                max={session.endTime}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Book Slot
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-6">
          <p className="text-red-500 font-medium">All slots are filled for this session.</p>
          <button
            onClick={onCancel}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      )}
    </div>
  );
};

// Session Details Component
const SessionDetails = ({ session, onFinalize, onBack, onCancelBooking, onDeleteSession }) => {
  const [totalAmount, setTotalAmount] = useState(session.totalAmount || '');
  const [isEditing, setIsEditing] = useState(!session.isPaid);
  const [individualCosts, setIndividualCosts] = useState({});
  const [useEvenSplit, setUseEvenSplit] = useState(true);
  const [showEmailSent, setShowEmailSent] = useState(false);
  const [costsMatchTotal, setCostsMatchTotal] = useState(true);
  
  // Initialize individual costs
  useEffect(() => {
    if (session.slots.length > 0) {
      if (session.individualCosts) {
        // Use existing individual costs if available
        setIndividualCosts(session.individualCosts);
        setUseEvenSplit(false);
      } else {
        // Create initial costs object with even distribution
        const costs = {};
        const perPersonCost = totalAmount && session.slots.length > 0 
          ? parseFloat(totalAmount) / session.slots.length 
          : 0;
          
        session.slots.forEach(slot => {
          costs[slot.id] = perPersonCost;
        });
        setIndividualCosts(costs);
      }
    }
  }, [session, totalAmount]);
  
  // Calculate total individual costs and check if it matches total amount
  useEffect(() => {
    if (!useEvenSplit && totalAmount) {
      const total = Object.values(individualCosts).reduce((sum, cost) => sum + (parseFloat(cost) || 0), 0);
      setCostsMatchTotal(Math.abs(total - parseFloat(totalAmount)) < 0.01);
    } else {
      setCostsMatchTotal(true);
    }
  }, [individualCosts, totalAmount, useEvenSplit]);
  
  const handleCostChange = (slotId, value) => {
    setIndividualCosts({
      ...individualCosts,
      [slotId]: parseFloat(value) || 0
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate that individual costs sum up to total amount when not using even split
    if (!useEvenSplit) {
      const total = Object.values(individualCosts).reduce((sum, cost) => sum + (parseFloat(cost) || 0), 0);
      if (Math.abs(total - parseFloat(totalAmount)) >= 0.01) {
        alert("Individual costs must add up to the total amount.");
        return;
      }
    }
    
    onFinalize(parseFloat(totalAmount), useEvenSplit ? null : individualCosts);
    setIsEditing(false);
    setShowEmailSent(true);
    
    // Hide the email notification after a few seconds
    setTimeout(() => {
      setShowEmailSent(false);
    }, 5000);
  };
  
  const totalIndividualCost = Object.values(individualCosts).reduce((sum, cost) => sum + (parseFloat(cost) || 0), 0);
  
  const costPerPerson = session.isPaid 
    ? (session.individualCosts ? Object.values(session.individualCosts).reduce((sum, cost) => sum + cost, 0) / session.slots.length : session.costPerPerson)
    : (totalAmount && session.slots.length > 0) 
      ? parseFloat(totalAmount) / session.slots.length 
      : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Session Details</h2>
        <div className="flex space-x-2">
          {!session.isPaid && (
            <button 
              onClick={onDeleteSession}
              className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white"
            >
              Delete Session
            </button>
          )}
          <button 
            onClick={onBack}
            className="px-3 py-1 rounded bg-gray-500 hover:bg-gray-600 text-white"
          >
            Back
          </button>
        </div>
      </div>
      
      <div className="mb-6 bg-blue-50 p-4 rounded-md">
        <p className="font-medium">Session Information:</p>
        <p>Date: {new Date(session.date).toLocaleDateString()}</p>
        <p>Time: {session.startTime} - {session.endTime}</p>
        <p>Location: {session.location || "NBC Granville"}</p>
        <p>Courts: {session.courts}</p>
        <p>Maximum Players: {session.maxSlots}</p>
        <p>Current Players: {session.slots.length}</p>
        <p>Status: {session.isPaid ? 'Finalized' : 'Open'}</p>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Players</h3>
        {session.slots.length > 0 ? (
          <div className="border rounded overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Slot</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {session.slots.map(slot => (
                  <tr key={slot.id}>
                    <td className="px-4 py-2 whitespace-nowrap">{slot.playerName}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{slot.startTime} - {slot.endTime}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{slot.email || 'No email'}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <button 
                        onClick={() => onCancelBooking(slot.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No players have booked slots yet.</p>
        )}
      </div>
      
      {session.slots.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Payment Information</h3>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-4 rounded">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Court Fee Amount</label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter total amount"
                />
              </div>
              
              {totalAmount && session.slots.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="evenSplit"
                      checked={useEvenSplit}
                      onChange={(e) => setUseEvenSplit(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="evenSplit" className="ml-2 block text-sm text-gray-700">
                      Split cost evenly (${costPerPerson.toFixed(2)} per person)
                    </label>
                  </div>
                  
                  {!useEvenSplit && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Individual Cost Adjustments</h4>
                      <div className="border rounded overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost ($)</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {session.slots.map(slot => (
                              <tr key={slot.id}>
                                <td className="px-4 py-2 whitespace-nowrap">{slot.playerName}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{slot.email || 'No email'}</td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={individualCosts[slot.id] || ''}
                                    onChange={(e) => handleCostChange(slot.id, e.target.value)}
                                    className="w-24 px-2 py-1 border rounded-md"
                                  />
                                </td>
                                
                                <td className="px-4 py-2 whitespace-nowrap text-right">
                                  <button 
                                    onClick={() => onCancelBooking(slot.id)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                  >
                                    Cancel
                                  </button>
                                </td>
                                
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50">
                            <tr>
                              <td colSpan="3" className="px-4 py-2 text-right font-medium">Total:</td>
                              <td className={`px-4 py-2 font-bold ${costsMatchTotal ? 'text-green-600' : 'text-red-600'}`}>
                                ${totalIndividualCost.toFixed(2)}
                                {!costsMatchTotal && (
                                  <span className="block text-xs">
                                    {totalIndividualCost > parseFloat(totalAmount) ? 'Over by' : 'Under by'} ${Math.abs(totalIndividualCost - parseFloat(totalAmount)).toFixed(2)}
                                  </span>
                                )}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      {!costsMatchTotal && (
                        <p className="text-red-500 mt-2 text-sm">
                          Individual costs must add up to the total amount before finalizing.
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="bg-green-50 p-3 rounded border border-green-200 text-sm">
                    <p className="font-medium">Payment Summary:</p>
                    <p>Players: {session.slots.length}</p>
                    <p>Total Amount: ${parseFloat(totalAmount).toFixed(2)}</p>
                    {useEvenSplit && (
                      <p className="text-green-600 font-bold">Cost per player: ${costPerPerson.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <p>Payment notifications will be sent to all members with email addresses</p>
                </div>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-md ${
                    (!useEvenSplit && !costsMatchTotal) 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                  disabled={!useEvenSplit && !costsMatchTotal}
                >
                  Finalize Payment & Send Notifications
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-gray-50 p-4 rounded space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Court Fee:</p>
                  <p className="font-medium">${session.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Players:</p>
                  <p className="font-medium">{session.slots.length}</p>
                </div>
                {session.individualCosts ? (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 mb-2">Individual Costs:</p>
                    <div className="border rounded overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {session.slots.map(slot => (
                            <tr key={slot.id}>
                              <td className="px-4 py-2 whitespace-nowrap">{slot.playerName}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{slot.email || 'No email'}</td>
                              <td className="px-4 py-2 whitespace-nowrap font-medium text-green-600">
                                ${(session.individualCosts[slot.id] || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-center">
                                <button 
                                  onClick={() => onCancelBooking(slot.id)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                                >
                                  Cancel
                                </button>
                                {session.isPaid && (
                                  <span className="ml-2 text-gray-500">(Finalized)</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600">Cost per Player:</p>
                    <p className="font-bold text-green-600">
                      ${session.costPerPerson ? session.costPerPerson.toFixed(2) : '0.00'}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4 mt-4">
                <p className="text-sm text-gray-600">Payment Details:</p>
                <p className="font-medium">Account Name: {session.paymentInfo.accountName}</p>
                <p className="font-medium">Account Number: {session.paymentInfo.accountNumber}</p>
                <p className="font-medium">Bank: {
                  session.paymentInfo.bank === 'Custom' 
                    ? session.paymentInfo.customBank || 'Custom Bank'
                    : session.paymentInfo.bank === 'CBA' 
                      ? 'Commonwealth Bank (CBA)' 
                      : session.paymentInfo.bank
                }</p>
              </div>
            </div>
          )}
          
          {showEmailSent && (
            <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Payment notification emails have been sent to all members
            </div>
          )}
        
        </div>
      )}
    </div>
  );
};


export default BadmintonBookingApp;