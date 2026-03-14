'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-primary py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
            Conditions Générales d&apos;Utilisation
          </h1>
          <p className="text-gray-300">
            Dernière mise à jour : 13 mars 2026
          </p>
        </div>
      </section>

      {/* Contenu */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-card p-8 md:p-12 space-y-8">

            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                1. Objet
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Les présentes Conditions Générales d&apos;Utilisation (ci-après « CGU ») ont pour objet
                de définir les modalités et conditions d&apos;utilisation de la plateforme
                « Les Gîtes du Nucléaire » (ci-après « la Plateforme »), accessible via le site web
                et l&apos;application mobile. La Plateforme met en relation des propriétaires de logements
                situés à proximité des centrales nucléaires françaises avec des travailleurs du secteur
                nucléaire en grand déplacement.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                2. Inscription et Compte Utilisateur
              </h2>
              <div className="text-gray-600 leading-relaxed space-y-3">
                <p>
                  L&apos;utilisation de la Plateforme nécessite la création d&apos;un compte.
                  L&apos;utilisateur s&apos;engage à fournir des informations exactes et à jour.
                </p>
                <p>
                  <strong>Locataires :</strong> Doivent fournir une adresse email valide et vérifier
                  leur numéro de téléphone. La fourniture d&apos;une attestation de mission est optionnelle
                  mais recommandée.
                </p>
                <p>
                  <strong>Propriétaires :</strong> Doivent fournir une pièce d&apos;identité valide et un
                  justificatif de propriété. Un abonnement mensuel de 8€ est requis pour publier
                  des annonces.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                3. Fonctionnement des Réservations
              </h2>
              <div className="text-gray-600 leading-relaxed space-y-3">
                <p>
                  Les réservations se font en ligne via la Plateforme. Le locataire sélectionne
                  un logement, les dates de séjour et le mode de paiement. La réservation est
                  confirmée après validation du propriétaire et réception du premier paiement.
                </p>
                <p>
                  Les séjours sont facturés à la semaine. Le paiement peut être effectué
                  par carte bancaire, en espèces, ou en mode partagé entre colocataires.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                4. Paiement et Tarification
              </h2>
              <div className="text-gray-600 leading-relaxed space-y-3">
                <p>
                  <strong>Paiement hebdomadaire :</strong> Les séjours sont découpés en échéances
                  hebdomadaires. Le locataire ne paie jamais la totalité du séjour d&apos;avance.
                </p>
                <p>
                  <strong>Paiement partagé :</strong> En cas de colocation, le paiement peut être
                  divisé entre les colocataires. Chaque personne paie sa part individuellement.
                </p>
                <p>
                  <strong>Paiement en espèces :</strong> Si le locataire choisit de payer en espèces,
                  un dépôt de garantie correspondant à la commission plateforme (8%) et une caution
                  de sécurité de 100€ sont prélevés en ligne. Le loyer est ensuite versé en espèces
                  directement au propriétaire.
                </p>
                <p>
                  <strong>Commission :</strong> La Plateforme perçoit une commission de 8% côté locataire
                  et de 10% côté propriétaire sur chaque réservation. Les propriétaires s&apos;acquittent
                  également d&apos;un abonnement mensuel de 8€.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                5. Politique d&apos;Annulation
              </h2>
              <div className="text-gray-600 leading-relaxed space-y-3">
                <p>
                  <strong>Plus de 7 jours avant l&apos;arrivée :</strong> Annulation gratuite,
                  remboursement intégral.
                </p>
                <p>
                  <strong>Moins de 7 jours avant l&apos;arrivée :</strong> Frais d&apos;annulation
                  correspondant à une semaine de loyer.
                </p>
                <p>
                  <strong>En cours de séjour :</strong> Le locataire règle la semaine en cours
                  et peut quitter le logement à la fin de celle-ci. Aucun paiement n&apos;est dû
                  pour les semaines restantes.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                6. Obligations des Utilisateurs
              </h2>
              <div className="text-gray-600 leading-relaxed space-y-3">
                <p>
                  Les utilisateurs s&apos;engagent à utiliser la Plateforme de bonne foi,
                  à ne pas publier de contenu frauduleux et à respecter les engagements pris
                  lors d&apos;une réservation.
                </p>
                <p>
                  Les propriétaires s&apos;engagent à fournir un logement conforme à la description
                  publiée et à maintenir les disponibilités à jour.
                </p>
                <p>
                  Les locataires s&apos;engagent à respecter le logement, le règlement intérieur
                  et à régler les paiements aux dates convenues.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                7. Vérification et Modération
              </h2>
              <p className="text-gray-600 leading-relaxed">
                La Plateforme se réserve le droit de vérifier l&apos;identité des utilisateurs,
                la conformité des logements, et de suspendre ou supprimer tout compte
                ne respectant pas les présentes CGU. Les logements sont soumis à une validation
                par l&apos;équipe d&apos;administration avant publication.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                8. Responsabilité
              </h2>
              <p className="text-gray-600 leading-relaxed">
                La Plateforme agit en tant qu&apos;intermédiaire et ne peut être tenue responsable
                des litiges entre propriétaires et locataires. Toutefois, un service de médiation
                est disponible pour accompagner la résolution des différends. La Plateforme ne
                garantit pas la disponibilité permanente du service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                9. Propriété Intellectuelle
              </h2>
              <p className="text-gray-600 leading-relaxed">
                L&apos;ensemble des contenus de la Plateforme (textes, images, logos, code)
                sont protégés par le droit de la propriété intellectuelle. Toute reproduction
                non autorisée est interdite.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                10. Contact
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Pour toute question relative aux présentes CGU, vous pouvez nous contacter
                à l&apos;adresse : <strong>contact@gites-nucleaire.fr</strong>
              </p>
            </div>

          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="text-primary font-semibold hover:underline">
              ← Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
