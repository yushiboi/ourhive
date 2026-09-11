import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientMessage, PlayerPublic, RoomPublic, ServerMessage, SubmitError } from "@shared/types";
import { adoptPlayerId, getPlayerId } from "@/lib/player";

export type HiveEvent =
  | { kind: "found"; word: string; points: number; pangram: boolean; byYou: boolean; playerName: string }
  | { kind: "reject"; error: SubmitError; word: string }
  | { kind: "error"; message: string };

type Status = "connecting" | "joining" | "ready" | "error";

export function useHiveSocket(code: string | undefined, name: string) {
  const [status, setStatus] = useState<Status>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomPublic | null>(null);
  const [you, setYou] = useState<PlayerPublic | null>(null);
  const [event, setEvent] = useState<HiveEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retries = useRef(0);
  const playerId = useRef(getPlayerId());
  const nameRef = useRef(name);
  nameRef.current = name;

  const push = useCallback((message: ClientMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
  }, []);

  const submit = useCallback(
    (word: string) => {
      push({ type: "submit", word });
    },
    [push],
  );

  useEffect(() => {
    if (!code || !name.trim()) return;

    let stopped = false;
    let pingTimer: ReturnType<typeof setInterval> | undefined;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (stopped) return;
      setStatus((prev) => (prev === "ready" ? "connecting" : prev));
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        retries.current = 0;
        setStatus("joining");
        ws.send(
          JSON.stringify({
            type: "join",
            playerId: playerId.current,
            name: nameRef.current.trim(),
            code,
          } satisfies ClientMessage),
        );
        pingTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" } satisfies ClientMessage));
        }, 20000);
      };

      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data) as ServerMessage;
        if (msg.type === "pong") return;
        if (msg.type === "room") {
          playerId.current = msg.you.id;
          adoptPlayerId(msg.you.id);
          setRoom(msg.room);
          setYou(msg.you);
          setError(null);
          setStatus("ready");
          return;
        }
        if (msg.type === "presence") {
          setRoom((current) => (current ? { ...current, players: msg.players } : current));
          return;
        }
        if (msg.type === "found") {
          setRoom((current) => {
            if (!current) return current;
            if (current.found.some((item) => item.word === msg.word.word)) {
              return { ...current, score: msg.score, rank: msg.rank, queenBee: msg.queenBee };
            }
            return {
              ...current,
              score: msg.score,
              rank: msg.rank,
              queenBee: msg.queenBee,
              found: [msg.word, ...current.found],
            };
          });
          setEvent({
            kind: "found",
            word: msg.word.word,
            points: msg.word.points,
            pangram: msg.word.pangram,
            byYou: msg.byYou,
            playerName: msg.word.playerName,
          });
          return;
        }
        if (msg.type === "reject") {
          setEvent({ kind: "reject", error: msg.error, word: msg.word });
          return;
        }
        if (msg.type === "error") {
          setError(msg.message);
          setStatus("error");
          setEvent({ kind: "error", message: msg.message });
        }
      };

      ws.onclose = () => {
        if (pingTimer) clearInterval(pingTimer);
        if (stopped) return;
        const wait = Math.min(8000, 400 * 2 ** retries.current);
        retries.current += 1;
        reconnectTimer = setTimeout(connect, wait);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const ws = wsRef.current;
      if (!ws || ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) connect();
    };

    connect();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);
    window.addEventListener("pageshow", onVisible);

    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
      window.removeEventListener("pageshow", onVisible);
      if (pingTimer) clearInterval(pingTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [code, name]);

  return { status, error, room, you, event, submit, setEvent };
}
