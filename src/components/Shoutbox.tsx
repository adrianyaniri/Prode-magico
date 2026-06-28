"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getShoutboxMessages, postShoutboxMessage, type ShoutboxMessage } from "@/app/(dashboard)/matches/shoutbox-actions";

export default function Shoutbox() {
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["shoutbox"],
    queryFn: async () => await getShoutboxMessages(),
    refetchInterval: 10000, // Refetch every 10 seconds for real-time feel
  });

  const mutation = useMutation({
    mutationFn: async (msg: string) => await postShoutboxMessage(msg),
    onMutate: async (newMsg) => {
      await queryClient.cancelQueries({ queryKey: ["shoutbox"] });
      const previousMessages = queryClient.getQueryData<ShoutboxMessage[]>(["shoutbox"]);
      
      const optimisticMsg: ShoutboxMessage = {
        id: Math.random().toString(),
        user_id: "optimistic",
        username: "Vos",
        message: newMsg,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<ShoutboxMessage[]>(["shoutbox"], (old = []) => {
        return [optimisticMsg, ...old].slice(0, 15);
      });

      setMessage("");
      return { previousMessages };
    },
    onError: (err, newMsg, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(["shoutbox"], context.previousMessages);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["shoutbox"] });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || mutation.isPending) return;
    mutation.mutate(message);
  }

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-[#1a1a24] shadow-sm overflow-hidden mb-6">
      <div className="bg-zinc-900/50 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Muro de los Lamentos 🤬
        </h3>
        {mutation.isPending && <span className="text-[10px] text-zinc-500">Enviando...</span>}
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto max-h-48 flex flex-col-reverse gap-2">
        {isLoading ? (
          <p className="text-xs text-zinc-500 text-center py-4">Cargando bardos...</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-4">Nadie se quejó todavía. ¡Sé el primero!</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="text-sm bg-zinc-800/20 px-3 py-2 rounded-lg border border-zinc-800/50">
              <span className="font-bold text-blue-400 mr-2">{msg.username}:</span>
              <span className="text-zinc-300 break-words">{msg.message}</span>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-zinc-800 bg-zinc-900/30 p-2 flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tirá tu chicana acá..."
          maxLength={150}
          className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/50 focus:bg-zinc-800 transition-colors"
        />
        <button
          type="submit"
          disabled={!message.trim() || mutation.isPending}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 flex items-center justify-center"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
