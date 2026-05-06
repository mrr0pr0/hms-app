import { useState } from "react";
import { useRouter } from "next/router";

export default function Register() {
  // alle varibler osm skal bruker
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    // når formen submites så håndterer denne funksjonen det
    e.preventDefault(); // forhindre default form submission
    setLoading(true); // sett loading state til true
    setError(""); // nullstill error state

    try {
      const res = await fetch("/api/users", {
        // kall API-ruten for å registrere
        method: "PUT", // burker put
        headers: { "Content-Type": "application/json" }, // sett content type til json
        body: JSON.stringify({ username, password }), // send username og password i body
      });

      if (res.ok) {
        // hvis responsen er ok så hent brukerdata og lagre hash
        const user = await res.json(); // hent brukerdata fra responsen
        localStorage.setItem("userHash", user.hash); // lagre hash i localStorage for å holde brukeren logget inn
        router.push("/"); // naviger til hjem siden
      } else {
        // hvis responsen ikke er ok så hent error melding og vis den
        const data = await res.json();
        setError(data.error || "Registration failed"); // sett error state til error meldingen
      }
    } catch (err) {
      // hvis det skjer en feil i nettverkskallet
      setError("Network error"); // sett error state til network error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "50px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      {" "}
      // enkel styling for å sentrere formen og gjøre den penere
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label htmlFor="username">Username:</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            background: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      <p style={{ marginTop: "20px", textAlign: "center" }}>
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
}
