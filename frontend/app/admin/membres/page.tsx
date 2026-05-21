"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Membre {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  date_inscription: string;
  est_mineur: boolean;
  statut: string;
}

const STATUT_STYLE: Record<string, string> = {
  ACTIF: "bg-green-100 text-green-800",
  EN_ATTENTE: "bg-amber-100 text-amber-800",
  SUSPENDU: "bg-red-100 text-red-800",
  ANCIEN: "bg-gray-100 text-gray-600",
};

export default function MembresPage() {
  const router = useRouter();
  const [membres, setMembres] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get<Membre[]>("/api/membres/")
      .then(setMembres)
      .finally(() => setLoading(false));
  }, []);

  const filtered = membres.filter(
    (m) =>
      `${m.prenom} ${m.nom} ${m.email}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Membres ({membres.length})</h1>
        <input
          type="search"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Chargement...</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Membre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Inscription</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => router.push(`/admin/membres/${m.id}`)}
                  className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium">
                      {m.prenom} {m.nom}
                      {m.est_mineur && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 rounded px-1.5 py-0.5">
                          mineur
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    <div>{m.email}</div>
                    <div>{m.telephone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{m.date_inscription}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUT_STYLE[m.statut] ?? "bg-gray-100"}`}
                    >
                      {m.statut}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                    Aucun membre trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
