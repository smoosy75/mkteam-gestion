"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

type FormData = {
  nom: string;
  prenom: string;
  date_naissance: string;
  nationalite?: string;
  adresse: string;
  telephone: string;
  email: string;
  instagram?: string;
  nom_responsable?: string;
  tel_responsable?: string;
  formule: string;
  type_abonnement: "mensuel" | "annuel";
  date_debut: string;
  nombre_mois?: number;
};

type PaiementOption = { label: string; type: "mensuel" | "annuel"; mois?: number };
type Categorie = { label: string; options: PaiementOption[] };

const CATEGORIES: Record<string, Categorie> = {
  adulte_annuel: {
    label: "Adulte — 700€/an",
    options: [
      { label: "1× 700€ (comptant)",   type: "annuel" },
      { label: "4× 175€ par CB",        type: "mensuel", mois: 4 },
      { label: "5× 140€ par chèque",    type: "mensuel", mois: 5 },
    ],
  },
  adulte_feminin: {
    label: "Adulte Féminin — 500€/an",
    options: [
      { label: "1× 500€ (comptant)",  type: "annuel" },
      { label: "4× 125€ par CB",       type: "mensuel", mois: 4 },
      { label: "5× 100€ par chèque",   type: "mensuel", mois: 5 },
    ],
  },
  adulte_noire: {
    label: "Adulte Ceinture noire — 600€/an",
    options: [
      { label: "1× 600€ (comptant)",  type: "annuel" },
      { label: "4× 150€ par CB",       type: "mensuel", mois: 4 },
      { label: "5× 120€ par chèque",   type: "mensuel", mois: 5 },
    ],
  },
  adulte_mensuel: {
    label: "Adulte — 200€/mois",
    options: [{ label: "200€/mois", type: "mensuel", mois: 1 }],
  },
  adolescent: {
    label: "Adolescent 16-17 ans — 550€/an",
    options: [{ label: "1× 550€ (comptant)", type: "annuel" }],
  },
  preadolescent: {
    label: "Pré-ado 11-15 ans — 500€/an",
    options: [
      { label: "1× 500€ (comptant)",       type: "annuel" },
      { label: "3× (paiement échelonné)",   type: "mensuel", mois: 3 },
    ],
  },
  enfant: {
    label: "Enfant 8-10 ans — 500€/an",
    options: [
      { label: "1× 500€ (comptant)",       type: "annuel" },
      { label: "3× (paiement échelonné)",   type: "mensuel", mois: 3 },
    ],
  },
  baby: {
    label: "Baby 5-7 ans — 450€/an",
    options: [
      { label: "1× 450€ (comptant)",       type: "annuel" },
      { label: "3× (paiement échelonné)",   type: "mensuel", mois: 3 },
    ],
  },
};

function calcAge(ddn: string): number {
  if (!ddn) return 99;
  return Math.floor(
    (Date.now() - new Date(ddn).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );
}

export default function InscriptionPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [categorie, setCategorie] = useState("");
  const [paiementIdx, setPaiementIdx] = useState<number | "">("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: { type_abonnement: "annuel", formule: "" },
  });

  const ddn = watch("date_naissance");
  const estMineur = calcAge(ddn) < 18;

  const optionsCat = categorie ? CATEGORIES[categorie]?.options ?? [] : [];
  const autoSingle = optionsCat.length === 1;

  const applyPaiement = (idx: number, cat: string) => {
    const opt = CATEGORIES[cat]?.options[idx];
    if (!opt) return;
    setValue("type_abonnement", opt.type);
    setValue("nombre_mois", opt.mois ?? undefined);
    setValue("formule", `${cat}__${idx}`);
  };

  const handleCategorieChange = (cat: string) => {
    setCategorie(cat);
    setPaiementIdx("");
    setValue("formule", "");
    if (CATEGORIES[cat]?.options.length === 1) {
      setPaiementIdx(0);
      applyPaiement(0, cat);
    }
  };

  const onSubmit = async (data: FormData) => {
    setServerError(null);

    // Validation cross-champs
    if (estMineur && !data.nom_responsable) {
      setError("nom_responsable", { message: "Obligatoire pour un mineur" });
      return;
    }
    if (estMineur && !data.tel_responsable) {
      setError("tel_responsable", { message: "Obligatoire pour un mineur" });
      return;
    }
    if (!categorie) {
      setServerError("Choisissez une catégorie d'abonnement.");
      return;
    }
    if (optionsCat.length > 1 && paiementIdx === "") {
      setServerError("Choisissez une option de paiement.");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/inscription/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        setServerError(JSON.stringify(err));
        return;
      }
      setSubmitted(true);
    } catch {
      setServerError("Erreur réseau, réessayez.");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow p-10 max-w-md text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-2">Dossier soumis</h1>
          <p className="text-gray-600">
            Le staff MK Team vous contactera sous peu pour confirmer votre inscription.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">MK Team Paris</h1>
          <p className="text-gray-500 mt-1">Formulaire de pré-inscription JJB</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-xl shadow p-8 space-y-6"
        >
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          {/* Identité */}
          <section>
            <h2 className="font-semibold text-lg mb-4 border-b pb-2">Identité</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Prénom *" error={errors.prenom?.message}>
                <input {...register("prenom", { required: "Requis" })} className={inp()} />
              </Field>
              <Field label="Nom *" error={errors.nom?.message}>
                <input {...register("nom", { required: "Requis" })} className={inp()} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Field label="Date de naissance *" error={errors.date_naissance?.message}>
                <input
                  type="date"
                  {...register("date_naissance", { required: "Requis" })}
                  className={inp()}
                />
              </Field>
              <Field label="Nationalité" error={errors.nationalite?.message}>
                <input {...register("nationalite")} className={inp()} />
              </Field>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="font-semibold text-lg mb-4 border-b pb-2">Contact</h2>
            <Field label="Adresse complète *" error={errors.adresse?.message}>
              <input {...register("adresse", { required: "Requis" })} className={inp()} />
            </Field>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Field label="Téléphone *" error={errors.telephone?.message}>
                <input
                  {...register("telephone", { required: "Requis" })}
                  placeholder="+33600000000"
                  className={inp()}
                />
              </Field>
              <Field label="Email *" error={errors.email?.message}>
                <input
                  type="email"
                  {...register("email", { required: "Requis" })}
                  className={inp()}
                />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Instagram" error={errors.instagram?.message}>
                <input
                  {...register("instagram")}
                  placeholder="@pseudo"
                  className={inp()}
                />
              </Field>
            </div>
          </section>

          {/* Responsable légal */}
          {estMineur && (
            <section className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h2 className="font-semibold text-lg mb-4">
                Responsable légal (mineur détecté)
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nom du responsable *" error={errors.nom_responsable?.message}>
                  <input {...register("nom_responsable")} className={inp()} />
                </Field>
                <Field label="Téléphone responsable *" error={errors.tel_responsable?.message}>
                  <input {...register("tel_responsable")} className={inp()} />
                </Field>
              </div>
            </section>
          )}

          {/* Abonnement */}
          <section>
            <h2 className="font-semibold text-lg mb-4 border-b pb-2">Abonnement</h2>
            <div className="space-y-4">
              <Field label="Catégorie *">
                <select
                  value={categorie}
                  onChange={(e) => handleCategorieChange(e.target.value)}
                  className={inp()}
                >
                  <option value="">— Choisir une catégorie —</option>
                  <optgroup label="Adultes">
                    <option value="adulte_annuel">Adulte — 700€/an</option>
                    <option value="adulte_feminin">Adulte Féminin — 500€/an</option>
                    <option value="adulte_noire">Adulte Ceinture noire — 600€/an</option>
                    <option value="adulte_mensuel">Adulte — 200€/mois</option>
                  </optgroup>
                  <optgroup label="Jeunes">
                    <option value="adolescent">Adolescent 16-17 ans — 550€/an</option>
                    <option value="preadolescent">Pré-ado 11-15 ans — 500€/an</option>
                    <option value="enfant">Enfant 8-10 ans — 500€/an</option>
                    <option value="baby">Baby 5-7 ans — 450€/an</option>
                  </optgroup>
                </select>
              </Field>

              {categorie && !autoSingle && (
                <Field label="Mode de paiement *">
                  <select
                    value={paiementIdx}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      setPaiementIdx(idx);
                      applyPaiement(idx, categorie);
                    }}
                    className={inp()}
                  >
                    <option value="">— Choisir —</option>
                    {optionsCat.map((opt, i) => (
                      <option key={i} value={i}>{opt.label}</option>
                    ))}
                  </select>
                </Field>
              )}

              {categorie && autoSingle && (
                <p className="text-sm text-gray-500">{optionsCat[0].label}</p>
              )}

              <Field label="Date de début *" error={errors.date_debut?.message}>
                <input
                  type="date"
                  {...register("date_debut", { required: "Requis" })}
                  className={inp()}
                />
              </Field>
            </div>
            <input type="hidden" {...register("formule")} />
            <input type="hidden" {...register("type_abonnement")} />
            <input type="hidden" {...register("nombre_mois", { valueAsNumber: true })} />
          </section>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition"
            >
              {isSubmitting ? "Envoi en cours..." : "Soumettre mon dossier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function inp() {
  return "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black";
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
