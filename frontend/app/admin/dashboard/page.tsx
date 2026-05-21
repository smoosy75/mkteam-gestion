"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Membre {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  statut: string;
  date_inscription: string;
  est_mineur: boolean;
}

interface AlerteItem {
  membre_id: string;
  membre_nom: string;
  date_expiration: string;
}

interface Alertes {
  certifs_expires: AlerteItem[];
  certifs_bientot: AlerteItem[];
  membres_suspendus: Membre[];
}

export default function DashboardPage() {
  const router = useRouter();
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
  const enAttente = membres.filter((m) => m.statut === "EN_ATTENTE");
  const suspendus = alertes?.membres_suspendus ?? [];

  if (loading) {
    return <div className="p-8 text-gray-500 text-sm">Chargement...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Membres actifs" value={actifs} color="green" />
        <StatCard label="En attente" value={enAttente.length} color="yellow" />
        <StatCard label="Suspendus" value={suspendus.length} color="red" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* EN_ATTENTE — à valider */}
        <Section title={`En attente de validation (${enAttente.length})`} dot="amber">
          {enAttente.length === 0 ? (
            <Empty>Aucun dossier en attente</Empty>
          ) : (
            <ul className="divide-y">
              {enAttente.map((m) => (
                <li
                  key={m.id}
                  onClick={() => router.push(`/admin/membres/${m.id}`)}
                  className="flex items-center justify-between py-2.5 hover:bg-gray-50 cursor-pointer px-1 rounded"
                >
                  <div>
                    <span className="font-medium text-sm">
                      {m.prenom} {m.nom}
                    </span>
                    {m.est_mineur && (
                      <span className="ml-1.5 text-xs bg-blue-100 text-blue-700 rounded px-1">mineur</span>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{m.email}</p>
                  </div>
                  <span className="text-xs text-gray-400">{m.date_inscription}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Suspendus */}
        <Section title={`Suspendus (${suspendus.length})`} dot="red">
          {suspendus.length === 0 ? (
            <Empty>Aucun membre suspendu</Empty>
          ) : (
            <ul className="divide-y">
              {suspendus.map((m) => (
                <li
                  key={m.id}
                  onClick={() => router.push(`/admin/membres/${m.id}`)}
                  className="flex items-center justify-between py-2.5 hover:bg-gray-50 cursor-pointer px-1 rounded"
                >
                  <span className="font-medium text-sm">
                    {m.prenom} {m.nom}
                  </span>
                  <span className="text-xs text-red-500 font-medium">SUSPENDU</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Certifs expirés */}
        <Section title={`Certifs expirés (${alertes?.certifs_expires.length ?? 0})`} dot="red">
          {(alertes?.certifs_expires.length ?? 0) === 0 ? (
            <Empty>Aucun</Empty>
          ) : (
            <ul className="divide-y">
              {alertes!.certifs_expires.map((c) => (
                <li
                  key={c.membre_id}
                  onClick={() => router.push(`/admin/membres/${c.membre_id}`)}
                  className="flex items-center justify-between py-2.5 hover:bg-gray-50 cursor-pointer px-1 rounded"
                >
                  <span className="text-sm">{c.membre_nom}</span>
                  <span className="text-xs text-red-600 font-medium">expiré le {c.date_expiration}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Certifs bientôt */}
        <Section title={`Certifs expirant bientôt (${alertes?.certifs_bientot.length ?? 0})`} dot="amber">
          {(alertes?.certifs_bientot.length ?? 0) === 0 ? (
            <Empty>Aucun dans les 30 jours</Empty>
          ) : (
            <ul className="divide-y">
              {alertes!.certifs_bientot.map((c) => (
                <li
                  key={c.membre_id}
                  onClick={() => router.push(`/admin/membres/${c.membre_id}`)}
                  className="flex items-center justify-between py-2.5 hover:bg-gray-50 cursor-pointer px-1 rounded"
                >
                  <span className="text-sm">{c.membre_nom}</span>
                  <span className="text-xs text-amber-600 font-medium">exp. {c.date_expiration}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
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

function Section({
  title,
  dot,
  children,
}: {
  title: string;
  dot: "red" | "amber" | "green";
  children: React.ReactNode;
}) {
  const dotColor = { red: "bg-red-500", amber: "bg-amber-500", green: "bg-green-500" }[dot];
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm">
        <span className={`w-2 h-2 rounded-full ${dotColor} inline-block`} />
        {title}
      </h2>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-400">{children}</p>;
}
