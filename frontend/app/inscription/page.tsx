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
  type_abonnement: "mensuel" | "annuel";
  date_debut: string;
  nombre_mois?: number;
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

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: { type_abonnement: "mensuel" },
  });

  const ddn = watch("date_naissance");
  const typeAbo = watch("type_abonnement");
  const estMineur = calcAge(ddn) < 18;

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
    if (data.type_abonnement === "mensuel" && !data.nombre_mois) {
      setError("nombre_mois", { message: "Obligatoire pour un abonnement mensuel" });
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
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type *" error={errors.type_abonnement?.message}>
                <select {...register("type_abonnement")} className={inp()}>
                  <option value="mensuel">Mensuel</option>
                  <option value="annuel">Annuel</option>
                </select>
              </Field>
              <Field label="Date de début *" error={errors.date_debut?.message}>
                <input
                  type="date"
                  {...register("date_debut", { required: "Requis" })}
                  className={inp()}
                />
              </Field>
            </div>
            {typeAbo === "mensuel" && (
              <div className="mt-4">
                <Field label="Nombre de mois *" error={errors.nombre_mois?.message}>
                  <input
                    type="number"
                    min={1}
                    {...register("nombre_mois", { valueAsNumber: true })}
                    className={inp()}
                  />
                </Field>
              </div>
            )}
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
