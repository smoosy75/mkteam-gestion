"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Membre {
  id: string;
  nom: string;
  prenom: string;
  statut: string;
}

interface Alertes {
  certifs_expires: { membre_id: string; membre_nom: string; date_expiration: string }[];
  certifs_bientot: { membre_id: string; membre_nom: string; date_expiration: string }[];
  membres_suspendus: Membre[];
}

export default function DashboardPage() {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [alertes, setAlertes] = useState<Alertes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Membre[]>("/api/membres/"),
      api.get<Alertes>("/api/alertes/"),
    ])
      .then(([m, a]) => {
        setMembres(m);
        setAlertes(a);
      })
      .finally(() => setLoading(false));
  }, []);

  const actifs = membres.filter((m) => m.statut === "ACTIF").length;
  const enAttente = membres.filter((m) => m.statut === "EN_ATTENTE").length;
  const suspendus = membres.filter((m) => m.statut === "SUSPENDU").length;

  if (loading) {
    return (
      <div className="p-8 text-gray-500 text-sm">Chargement...</div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Membres actifs" value={actifs} color="green" />
        <StatCard label="En attente" value={enAttente} color="yellow" />
        <StatCard label="Suspendus" value={suspendus} color="red" />
      </div>

      {/* Alertes */}
      {alertes && (
        <div className="grid grid-cols-2 gap-6">
          {/* Certifs expirés */}
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              Certifs expirés ({alertes.certifs_expires.length})
            </h2>
            {alertes.certifs_expires.length === 0 ? (
              <p className="text-sm text-gray-400">Aucun</p>
            ) : (
              <ul className="space-y-2">
                {alertes.certifs_expires.map((c) => (
                  <li key={c.membre_id} className="text-sm flex justify-between">
                    <span>{c.membre_nom}</span>
                    <span className="text-red-600">{c.date_expiration}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Certifs bientôt expirés */}
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              Certifs expirant bientôt ({alertes.certifs_bientot.length})
            </h2>
            {alertes.certifs_bientot.length === 0 ? (
              <p className="text-sm text-gray-400">Aucun</p>
            ) : (
              <ul className="space-y-2">
                {alertes.certifs_bientot.map((c) => (
                  <li key={c.membre_id} className="text-sm flex justify-between">
                    <span>{c.membre_nom}</span>
                    <span className="text-amber-600">{c.date_expiration}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "green" | "yellow" | "red";
}) {
  const colors = {
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm mt-1 opacity-80">{label}</p>
    </div>
  );
}
