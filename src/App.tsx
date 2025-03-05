import { useState, useEffect } from "react";

const socket = new WebSocket("ws://localhost:8080");

export default function PlanningPoker() {
  const [role, setRole] = useState<"Moderator" | "Participant" | null>(null);
  const [name, setName] = useState("");
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [votes, setVotes] = useState<{ name: string; value: number }[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [hasJoined, setHasJoined] = useState(false);
  const [showVotes, setShowVotes] = useState(false);
  const [userVotes, setUserVotes] = useState<{ [key: string]: boolean }>({});

  const cards = [1, 2, 3, 5, 8, 13, 21];

  useEffect(() => {
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log(" useEffect Received WebSocket message:", message); // Debug log
      switch (message.type) {
        case "vote":
          //setVotes((prevVotes) => [...prevVotes, { name: message.name, value: message.value }]);
          setVotes((prevVotes) => {
            const updatedVotes = prevVotes.filter(vote => vote.name !== message.name);
            return [...updatedVotes, { name: message.name, value: message.value }];
          });
          setUserVotes((prev) => ({ ...prev, [message.name]: true }));
          break;
        case "user-joined":
          setUsers((prevUsers) => [...prevUsers, message.name]);
          setUserVotes((prev) => ({ ...prev, [message.name]: false }));
          break;
        case "reveal-votes":
          setShowVotes(true);
          break;
        default:
          console.error("Unknown message type:", message.type); // Error log
      }
    };
  }, []);

  const handleVote = (value: number) => {
    if (!name) return; // Ensure name is set before sending vote
    setSelectedCard(value);
    console.log("Received value in handleVote", value)
    const voteData = JSON.stringify({ type: "vote", name: name, value: value });
    console.log(" handleVote - Sending vote & name:", { type: "vote", name, value });
    //console.log("Sending vote:", voteData); // Debug log
    socket.send(voteData);
  };

  const handleJoin = () => {
    if (name.trim() !== "") {
      const message = JSON.stringify({ type: "user-joined", name });
      console.log("Sending WebSocket message:", message); // Debug log
      socket.send(message);
      setHasJoined(true);
    }
  };
  

  return (
    <div className="flex flex-col min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold">Planning Poker</h1>
      
      {!role && (
        <div className="mt-6">
          <h2>Select a role:</h2>
          <button className="px-4 py-2 m-2 bg-blue-500 text-white rounded" onClick={() => setRole("Moderator")}>Moderator</button>
          <button className="px-4 py-2 m-2 bg-green-500 text-white rounded" onClick={() => setRole("Participant")}>Participant</button>
        </div>
      )}
      
      {role && !users.includes(name) && (
        <div className="mt-6">
          <input
            className="border px-2 py-1"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="px-4 py-2 m-2 bg-blue-500 text-white rounded" onClick={handleJoin}>Join</button>
        </div>
      )}
      
      {role === "Participant" && name && hasJoined && !showVotes && (
        <div className="mt-6">
          <h2>Select a vote:</h2>
          <div className="flex justify-center space-x-2 mt-2">
            {cards.map((card) => (
              <button
                key={card}
                className={`px-4 py-2 rounded ${selectedCard === card ? "bg-gray-500" : "bg-blue-500 text-white"}`}
                onClick={() => handleVote(card)}
              >
                {card}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {role === "Moderator" && name && hasJoined && users.length > 0 && (
        <div className="mt-6">
          <h2>Users Joined:</h2>
          <ul>
            {users.map((user, index) => (
              //<li key={index}>{user}</li>
              <li key={index}  className="mt-1">{user} - {userVotes[user] ? "✅" : "⏳"}</li>
              // <li key={index}>
              //   {user} {uservotes[user] ? "" : ""}
              // </li>
            ))}
          </ul>
        </div>
      )}
      
      {role === "Moderator" && name && hasJoined && (
        <div className="mt-6">
        <button 
            className="px-4 py-2 bg-red-500 text-white rounded" 
            onClick={() => {
              setShowVotes(true)
              socket.send(JSON.stringify({ type: "reveal-votes" }))
            }}
          >
            Reveal Votes
          </button>
        </div>
      )}
      
      {showVotes && (
        <div className="mt-6">
          {votes.length > 0 ? (
            <>
              <h2 className="mt-4">Votes:</h2>
              <ul>
                {votes.map((vote, index) => (
                  <li key={index} className="mt-1">{vote.name}: {vote.value}</li>
                ))}
              </ul>
            </>
          ) : (
            <h2 className="mt-4">Votes: None yet</h2>
          )}
        </div>
      )}
    </div>
  );
}
