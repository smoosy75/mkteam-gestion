"use client";

import { useEffect, useState, use } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const DOC_LABELS: Record<string, string> = {
  certif_medical: "Certificat médical",
  photo_identite: "Photo d'identité",
  reglement: "Règlement intérieur signé",
  autorisation_parentale: "Autorisation parentale",
};

interface TokenInfo {
  membre: { prenom: string; nom: string; est_mineur: boolean };
  manquants: string[];
  expires_at: string;
}

export default function UploadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [info, setInfo] = useState<TokenInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<Record<string, File>>({});
  const [reglementAccepte, setReglementAccepte] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/upload/${token}/`)
      .then(async (res) => {
        if (!res.ok) {
          const d = await res.json();
          setError(d.detail ?? "Lien invalide.");
          return;
        }
        setInfo(await res.json());
      })
      .catch(() => setError("Erreur réseau."));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(files).length === 0) return;
    setSubmitting(true);

    const form = new FormData();
    for (const [type, file] of Object.entries(files)) {
      form.append(type, file);
    }
    if (reglementAccepte) form.append("reglement_accepte", "true");

    const res = await fetch(`${API_URL}/api/upload/${token}/`, {
      method: "POST",
      body: form,
    });

    if (res.ok) {
      setSubmitted(true);
    } else {
      const d = await res.json();
      setError(d.detail ?? "Erreur lors de l'envoi.");
    }
    setSubmitting(false);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow p-10 max-w-md text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-sm text-gray-500 mt-2">Contactez le staff MK Team Paris.</p>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Chargement...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow p-10 max-w-md text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-bold mb-2">Documents envoyés</h1>
          <p className="text-gray-500 text-sm">
            Le staff MK Team va vérifier vos documents et vous contactera.
          </p>
        </div>
      </div>
    );
  }

  if (info.manquants.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow p-10 max-w-md text-center">
          <div className="text-4xl mb-4">✅</div>
          <p className="text-gray-600">Tous vos documents ont déjà été reçus.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">MK Team Paris</h1>
          <p className="text-gray-500 text-sm mt-1">
            Bonjour {info.membre.prenom} — déposez vos documents
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow p-8 space-y-6"
        >
          {info.manquants.map((type) => (
            <div key={type}>
              {type === "reglement" ? (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reglementAccepte}
                    onChange={(e) => setReglementAccepte(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-black"
                    required
                  />
                  <span className="text-sm">
                    J'ai lu et j'accepte le{" "}
                    <span className="text-blue-600 underline cursor-pointer">
                      règlement intérieur MK Team Paris
                    </span>
                  </span>
                </label>
              ) : (
                <>
                  <label className="block text-sm font-medium mb-1">
                    {DOC_LABELS[type] ?? type} *
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setFiles((prev) => ({ ...prev, [type]: f }));
                    }}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-gray-100 file:cursor-pointer"
                  />
                  {type === "certif_medical" && (
                    <p className="text-xs text-gray-400 mt-1">
                      Validité : 1 an à compter de la date d'émission
                    </p>
                  )}
                </>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={submitting || Object.keys(files).length === 0}
            className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition"
          >
            {submitting ? "Envoi en cours..." : "Envoyer mes documents"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          Lien valable jusqu'au {new Date(info.expires_at).toLocaleDateString("fr-FR")}
        </p>
      </div>
    </div>
  );
}
