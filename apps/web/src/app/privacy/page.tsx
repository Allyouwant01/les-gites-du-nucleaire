'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-primary py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
            Politique de Confidentialité
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
                1. Responsable du Traitement
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Le responsable du traitement des données personnelles est la société
                Les Gîtes du Nucléaire, dont le siège social est situé à Paris, France.
                Contact : <strong>contact@lesgitesdunucleaire.fr</strong>
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                2. Données Collectées
              </h2>
              <div className="text-gray-600 leading-relaxed space-y-3">
                <p>Nous collectons les données suivantes :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Données d&apos;identification :</strong> nom, prénom, adresse email,
                    numéro de téléphone, photo de profil
                  </li>
                  <li>
                    <strong>Données de vérification :</strong> pièce d&apos;identité (propriétaires),
                    attestation de mission (locataires, optionnel)
                  </li>
                  <li>
                    <strong>Données de paiement :</strong> traitées par Stripe, nous ne stockons
                    pas vos numéros de carte bancaire
                  </li>
                  <li>
                    <strong>Données de navigation :</strong> adresse IP, type de navigateur,
                    pages visitées
                  </li>
                  <li>
                    <strong>Données de réservation :</strong> logements réservés, dates, montants,
                    historique de paiement
                  </li>
                  <li>
                    <strong>Messages :</strong> contenus des conversations entre utilisateurs
                    via la messagerie de la Plateforme
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                3. Finalités du Traitement
              </h2>
              <div className="text-gray-600 leading-relaxed space-y-2">
                <p>Vos données sont utilisées pour :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Créer et gérer votre compte utilisateur</li>
                  <li>Permettre la mise en relation entre locataires et propriétaires</li>
                  <li>Traiter les réservations et les paiements</li>
                  <li>Vérifier l&apos;identité des propriétaires et la conformité des logements</li>
                  <li>Envoyer des notifications (réservations, paiements, messages)</li>
                  <li>Améliorer nos services et personnaliser l&apos;expérience utilisateur</li>
                  <li>Répondre aux obligations légales et réglementaires</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                4. Base Légale
              </h2>
              <div className="text-gray-600 leading-relaxed space-y-3">
                <p>Le traitement de vos données repose sur :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>L&apos;exécution du contrat :</strong> pour le traitement des réservations
                    et des paiements
                  </li>
                  <li>
                    <strong>Le consentement :</strong> pour l&apos;envoi de notifications marketing
                  </li>
                  <li>
                    <strong>L&apos;intérêt légitime :</strong> pour la prévention des fraudes
                    et l&apos;amélioration des services
                  </li>
                  <li>
                    <strong>L&apos;obligation légale :</strong> pour la conservation des données
                    de facturation
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                5. Partage des Données
              </h2>
              <div className="text-gray-600 leading-relaxed space-y-3">
                <p>Vos données peuvent être partagées avec :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Stripe :</strong> pour le traitement sécurisé des paiements
                  </li>
                  <li>
                    <strong>Firebase (Google) :</strong> pour l&apos;envoi de notifications push
                  </li>
                  <li>
                    <strong>Cloudinary :</strong> pour l&apos;hébergement des images
                  </li>
                  <li>
                    <strong>Les autres utilisateurs :</strong> votre prénom, photo de profil
                    et avis sont visibles par les autres membres
                  </li>
                </ul>
                <p>
                  Nous ne vendons jamais vos données personnelles à des tiers.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                6. Durée de Conservation
              </h2>
              <div className="text-gray-600 leading-relaxed space-y-3">
                <p>
                  Les données de votre compte sont conservées tant que votre compte est actif.
                  En cas de suppression du compte, vos données sont effacées dans un délai
                  de 30 jours, à l&apos;exception des données de facturation qui sont conservées
                  pendant 10 ans conformément à la législation fiscale.
                </p>
                <p>
                  Les documents de vérification d&apos;identité sont supprimés dans les 6 mois
                  suivant la vérification.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                7. Vos Droits (RGPD)
              </h2>
              <div className="text-gray-600 leading-relaxed space-y-3">
                <p>
                  Conformément au Règlement Général sur la Protection des Données (RGPD),
                  vous disposez des droits suivants :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Droit d&apos;accès :</strong> obtenir une copie de vos données</li>
                  <li><strong>Droit de rectification :</strong> corriger vos données</li>
                  <li><strong>Droit à l&apos;effacement :</strong> demander la suppression de vos données</li>
                  <li><strong>Droit à la portabilité :</strong> récupérer vos données dans un format structuré</li>
                  <li><strong>Droit d&apos;opposition :</strong> vous opposer au traitement de vos données</li>
                  <li><strong>Droit à la limitation :</strong> limiter le traitement de vos données</li>
                </ul>
                <p>
                  Pour exercer ces droits, contactez-nous à : <strong>contact@lesgitesdunucleaire.fr</strong>
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                8. Sécurité
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées
                pour protéger vos données : chiffrement SSL/TLS, hashage des mots de passe,
                accès restreint aux données, sauvegardes régulières. Les paiements sont
                traités par Stripe, certifié PCI-DSS.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                9. Cookies
              </h2>
              <p className="text-gray-600 leading-relaxed">
                La Plateforme utilise des cookies strictement nécessaires au fonctionnement
                du service (authentification, préférences). Nous n&apos;utilisons pas de cookies
                publicitaires. Des cookies d&apos;analyse anonymes peuvent être utilisés pour
                améliorer l&apos;expérience utilisateur.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                10. Contact
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Pour toute question relative à cette politique de confidentialité,
                contactez notre Délégué à la Protection des Données :
                <br /><strong>contact@lesgitesdunucleaire.fr</strong>
              </p>
              <p className="text-gray-600 leading-relaxed mt-3">
                Vous pouvez également introduire une réclamation auprès de la
                <strong> CNIL</strong> (Commission Nationale de l&apos;Informatique et des Libertés)
                si vous estimez que le traitement de vos données n&apos;est pas conforme.
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
