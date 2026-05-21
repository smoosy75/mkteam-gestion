"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Document {
  id: string;
  type: string;
  url: string;
  date_expiration: string | null;
  actif: boolean;
}

interface Ceinture {
  id: string;
  grade: string;
  nom_prof: string;
  date_obtention: string;
}

interface Paiement {
  id: string;
  date: string;
  montant: string;
  moyen: string;
  note: string;
  created_by_nom: string | null;
}

interface Abonnement {
  id: string;
  type: string;
  date_debut: string;
  nombre_mois: number | null;
  actif: boolean;
}

interface MembreDetail {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  date_naissance: string;
  est_mineur: boolean;
  nom_responsable: string;
  tel_responsable: string;
  date_inscription: string;
  archive: boolean;
  dossier_valide: boolean;
  has_active_token: boolean;
  statut: string;
  documents: Document[];
  ceintures: Ceinture[];
  abonnements: Abonnement[];
  paiements?: Paiement[];
}

const STATUT_STYLE: Record<string, string> = {
  ACTIF: "bg-green-100 text-green-800",
  EN_ATTENTE: "bg-amber-100 text-amber-800",
  SUSPENDU: "bg-red-100 text-red-800",
  ANCIEN: "bg-gray-100 text-gray-600",
};

const GRADE_LABEL: Record<string, string> = {
  blanche: "⚪ Blanche",
  bleue: "🔵 Bleue",
  violette: "🟣 Violette",
  marron: "🟤 Marron",
  noire: "⚫ Noire",
};

export default function FicheMembrePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [membre, setMembre] = useState<MembreDetail | null>(null);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);

  // Paiement form
  const [paiementForm, setPaiementForm] = useState({
    date: new Date().toISOString().split("T")[0],
    montant: "",
    moyen: "especes" as "especes" | "cheque" | "tpe",
    note: "",
  });
  const [paiementLoading, setPaiementLoading] = useState(false);
  const [paiementError, setPaiementError] = useState<string | null>(null);

  // Ceinture form
  const [ceintureForm, setCeintureForm] = useState({
    grade: "blanche" as string,
    nom_prof: "",
    date_obtention: new Date().toISOString().split("T")[0],
  });
  const [ceintureLoading, setCeintureLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<MembreDetail>(`/api/membres/${id}/`),
      api.get<Paiement[]>(`/api/membres/${id}/paiements/`),
    ])
      .then(([m, p]) => {
        setMembre(m);
        setPaiements(p);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handlePaiement = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaiementError(null);
    setPaiementLoading(true);
    try {
      const p = await api.post<Paiement>(`/api/membres/${id}/paiements/`, paiementForm);
      setPaiements((prev) => [p, ...prev]);
      setPaiementForm({ date: new Date().toISOString().split("T")[0], montant: "", moyen: "especes", note: "" });
    } catch {
      setPaiementError("Erreur lors de l'enregistrement.");
    } finally {
      setPaiementLoading(false);
    }
  };

  const handleCeinture = async (e: React.FormEvent) => {
    e.preventDefault();
    setCeintureLoading(true);
    try {
      await api.post(`/api/membres/${id}/ceintures/`, ceintureForm);
      const m = await api.get<MembreDetail>(`/api/membres/${id}/`);
      setMembre(m);
    } finally {
      setCeintureLoading(false);
    }
  };

  const handleArchiver = async () => {
    if (!confirm("Archiver ce membre ?")) return;
    await api.patch(`/api/membres/${id}/archiver/`);
    router.push("/admin/membres");
  };

  const [validating, setValidating] = useState(false);

  const handleValider = async () => {
    setValidating(true);
    try {
      await api.patch(`/api/membres/${id}/valider/`);
      const m = await api.get<MembreDetail>(`/api/membres/${id}/`);
      setMembre(m);
    } finally {
      setValidating(false);
    }
  };

  const [sendingLink, setSendingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const handleSendLink = async () => {
    setSendingLink(true);
    setLinkError(null);
    try {
      await api.post(`/api/membres/${id}/send_document_link/`, {});
      const m = await api.get<MembreDetail>(`/api/membres/${id}/`);
      setMembre(m);
    } catch {
      setLinkError("Échec envoi email — vérifiez la config SMTP.");
    } finally {
      setSendingLink(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-400 text-sm">Chargement...</div>;
  if (!membre) return <div className="p-8 text-red-500">Membre introuvable</div>;

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {membre.prenom} {membre.nom}
            {membre.est_mineur && (
              <span className="ml-2 text-sm bg-blue-100 text-blue-700 rounded px-2 py-0.5">mineur</span>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{membre.email} · {membre.telephone}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${STATUT_STYLE[membre.statut]}`}>
            {membre.statut}
          </span>
          {membre.statut === "EN_ATTENTE" && !membre.archive && (
            <>
              <button
                onClick={handleValider}
                disabled={validating}
                className="text-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 rounded px-3 py-1"
              >
                {validating ? "..." : "Valider le dossier"}
              </button>
              <button
                onClick={handleSendLink}
                disabled={sendingLink || membre.has_active_token}
                className="text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed rounded px-3 py-1"
              >
                {membre.has_active_token ? "Lien envoyé ✓" : sendingLink ? "Envoi..." : "Envoyer lien documents"}
              </button>
            </>
          )}
          {linkError && (
            <span className="text-xs text-red-600">{linkError}</span>
          )}
          {!membre.archive && (
            <button
              onClick={handleArchiver}
              className="text-sm text-gray-500 hover:text-red-600 border rounded px-3 py-1"
            >
              Archiver
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Colonne gauche */}
        <div className="space-y-5">
          {/* Infos */}
          <Card title="Informations">
            <Row label="Né(e) le" value={membre.date_naissance} />
            <Row label="Adresse" value={membre.adresse} />
            {membre.est_mineur && (
              <>
                <Row label="Responsable" value={membre.nom_responsable} />
                <Row label="Tél. responsable" value={membre.tel_responsable} />
              </>
            )}
            <Row label="Inscrit le" value={membre.date_inscription} />
          </Card>

          {/* Documents */}
          <Card title="Documents">
            {(() => {
              const requis = ["certif_medical", "photo_identite", "reglement", ...(membre.est_mineur ? ["autorisation_parentale"] : [])];
              const actifs = new Set(membre.documents.filter(d => d.actif).map(d => d.type));
              return (
                <>
                  <ul className="space-y-2 mb-3">
                    {requis.map((type) => {
                      const doc = membre.documents.find(d => d.type === type && d.actif);
                      return (
                        <li key={type} className="text-sm flex items-center justify-between">
                          <span className={`flex items-center gap-1.5 ${doc ? "" : "text-red-500"}`}>
                            <span>{doc ? "✓" : "✗"}</span>
                            <span>{type.replace(/_/g, " ")}</span>
                          </span>
                          {doc && (
                            <div className="flex items-center gap-2">
                              {doc.date_expiration && (
                                <span className="text-xs text-gray-500">exp. {doc.date_expiration}</span>
                              )}
                              {doc.url && (
                                <a href={doc.url} target="_blank" rel="noreferrer"
                                  className="text-xs text-blue-600 hover:underline">Voir</a>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {requis.every(t => actifs.has(t)) ? (
                    <p className="text-xs text-green-600 font-medium">Dossier complet</p>
                  ) : (
                    <p className="text-xs text-red-500 font-medium">Dossier incomplet — membre EN_ATTENTE</p>
                  )}
                </>
              );
            })()}
          </Card>

          {/* Ceintures */}
          <Card title="Ceintures">
            {membre.ceintures.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium">
                  Actuel : {GRADE_LABEL[membre.ceintures[0].grade]}
                </p>
              </div>
            )}
            <form onSubmit={handleCeinture} className="space-y-2 border-t pt-3">
              <p className="text-xs font-medium text-gray-500 uppercase">Saisir une ceinture</p>
              <select
                value={ceintureForm.grade}
                onChange={(e) => setCeintureForm({ ...ceintureForm, grade: e.target.value })}
                className={inp()}
              >
                {Object.entries(GRADE_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <input
                placeholder="Nom du prof"
                value={ceintureForm.nom_prof}
                onChange={(e) => setCeintureForm({ ...ceintureForm, nom_prof: e.target.value })}
                required
                className={inp()}
              />
              <input
                type="date"
                value={ceintureForm.date_obtention}
                onChange={(e) => setCeintureForm({ ...ceintureForm, date_obtention: e.target.value })}
                className={inp()}
              />
              <button type="submit" disabled={ceintureLoading} className={btn()}>
                {ceintureLoading ? "..." : "Enregistrer"}
              </button>
            </form>
          </Card>
        </div>

        {/* Colonne droite */}
        <div className="space-y-5">
          {/* Abonnement */}
          {membre.abonnements.length > 0 && (
            <Card title="Abonnement">
              {membre.abonnements.map((a) => (
                <div key={a.id} className="text-sm space-y-1">
                  <Row label="Type" value={a.type === "mensuel" ? "Mensuel" : "Annuel"} />
                  <Row label="Début" value={a.date_debut} />
                  {a.nombre_mois && <Row label="Durée" value={`${a.nombre_mois} mois`} />}
                  <Row label="Statut" value={a.actif ? "Actif" : "Inactif"} />
                </div>
              ))}
            </Card>
          )}

          <Card title="Enregistrer un paiement">
            {paiementError && (
              <p className="text-sm text-red-600 mb-2">{paiementError}</p>
            )}
            <form onSubmit={handlePaiement} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={paiementForm.date}
                  onChange={(e) => setPaiementForm({ ...paiementForm, date: e.target.value })}
                  className={inp()}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Montant €"
                  value={paiementForm.montant}
                  onChange={(e) => setPaiementForm({ ...paiementForm, montant: e.target.value })}
                  required
                  className={inp()}
                />
              </div>
              <select
                value={paiementForm.moyen}
                onChange={(e) => setPaiementForm({ ...paiementForm, moyen: e.target.value as "especes" | "cheque" | "tpe" })}
                className={inp()}
              >
                <option value="especes">Espèces</option>
                <option value="cheque">Chèque</option>
                <option value="tpe">TPE</option>
              </select>
              <input
                placeholder="Note (optionnel)"
                value={paiementForm.note}
                onChange={(e) => setPaiementForm({ ...paiementForm, note: e.target.value })}
                className={inp()}
              />
              <button type="submit" disabled={paiementLoading} className={btn()}>
                {paiementLoading ? "..." : "Enregistrer le paiement"}
              </button>
            </form>
          </Card>

          <Card title={`Historique paiements (${paiements.length})`}>
            {paiements.length === 0 ? (
              <p className="text-sm text-gray-400">Aucun paiement</p>
            ) : (
              <ul className="space-y-2">
                {paiements.map((p) => (
                  <li key={p.id} className="text-sm flex justify-between items-start">
                    <div>
                      <span className="font-medium">{p.montant} €</span>
                      <span className="text-gray-500 ml-2">{p.moyen}</span>
                      {p.note && <span className="text-gray-400 ml-1">· {p.note}</span>}
                    </div>
                    <span className="text-gray-400 text-xs">{p.date}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-500">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-1 border-b last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function inp() {
  return "w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black";
}

function btn() {
  return "w-full bg-black text-white py-2 rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition";
}
