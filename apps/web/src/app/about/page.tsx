'use client';

import { Shield, Users, Zap, Heart, MapPin, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-primary py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
            Qui sommes-nous ?
          </h1>
          <p className="text-xl text-gray-200 leading-relaxed">
            Les Gîtes du Nucléaire est la première plateforme de réservation
            de logements dédiée aux travailleurs du nucléaire en grand déplacement en France.
          </p>
        </div>
      </section>

      {/* Notre mission */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-heading font-bold text-gray-900 mb-6">
            Notre mission
          </h2>
          <div className="prose prose-lg text-gray-600 space-y-4">
            <p>
              Chaque année, des milliers de travailleurs du nucléaire sont envoyés en grand
              déplacement sur les 18 centrales nucléaires actives en France. Jusqu&apos;ici,
              trouver un logement relevait du parcours du combattant : groupes Facebook,
              petites annonces non vérifiées, arnaques fréquentes.
            </p>
            <p>
              <strong>Les Gîtes du Nucléaire</strong> a été créé pour résoudre ce problème.
              Notre plateforme centralise l&apos;offre de logements autour des centrales nucléaires
              et garantit un processus de réservation sécurisé, transparent et adapté
              aux contraintes spécifiques de cette communauté.
            </p>
            <p>
              Nous comprenons que les missions peuvent être annulées du jour au lendemain,
              que les travailleurs partagent souvent un logement à 4 ou 5, et que le paiement
              hebdomadaire est la norme. C&apos;est pourquoi chaque fonctionnalité a été pensée
              pour répondre précisément à ces besoins.
            </p>
          </div>
        </div>
      </section>

      {/* Nos valeurs */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-heading font-bold text-gray-900 text-center mb-12">
            Nos valeurs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Sécurité',
                desc: 'Chaque propriétaire et chaque logement est vérifié par notre équipe avant publication. Fini les arnaques.',
              },
              {
                icon: Heart,
                title: 'Transparence',
                desc: 'Pas de frais cachés, pas de mauvaises surprises. Les prix affichés sont les prix réels, à la semaine.',
              },
              {
                icon: Users,
                title: 'Communauté',
                desc: 'Construite par et pour les travailleurs du nucléaire. Nous comprenons vos contraintes et vos besoins.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-8 shadow-card text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Icon className="text-primary" size={32} />
                </div>
                <h3 className="text-xl font-heading font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pourquoi nous choisir */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-heading font-bold text-gray-900 mb-8">
            Pourquoi choisir Les Gîtes du Nucléaire ?
          </h2>
          <div className="space-y-6">
            {[
              {
                icon: CreditCard,
                title: 'Paiement hebdomadaire',
                desc: 'Ne payez jamais la totalité du séjour d\'avance. Réglez semaine par semaine, comme vous en avez l\'habitude.',
              },
              {
                icon: Users,
                title: 'Paiement partagé entre colocataires',
                desc: 'Plus besoin qu\'une seule personne avance la totalité. Chaque colocataire paie sa part individuellement.',
              },
              {
                icon: Zap,
                title: 'Espèces acceptées',
                desc: 'Payez en espèces directement au propriétaire. La plateforme prélève sa commission via un petit dépôt en ligne.',
              },
              {
                icon: MapPin,
                title: '18 centrales couvertes',
                desc: 'De Gravelines à Golfech, de Flamanville à Tricastin : trouvez un logement près de chaque centrale de France.',
              },
              {
                icon: Shield,
                title: 'Annulation flexible',
                desc: 'Démobilisé en urgence ? Annulation gratuite à plus de 7 jours. En cours de séjour, partez en fin de semaine sans frais supplémentaires.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-5 items-start">
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="text-primary" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-bold text-gray-900 mb-1">{title}</h3>
                  <p className="text-gray-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chiffres */}
      <section className="py-16 bg-primary">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '18', label: 'Centrales couvertes' },
              { value: '56', label: 'Réacteurs actifs' },
              { value: '8€', label: 'Abonnement/mois' },
              { value: '10%', label: 'Commission proprio' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-4xl md:text-5xl font-heading font-bold text-accent">{value}</p>
                <p className="text-gray-300 mt-2 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">
            Prêt à trouver votre prochain logement ?
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Rejoignez la communauté des travailleurs du nucléaire qui ont dit adieu
            aux arnaques et aux galères de logement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/listings" className="btn-primary text-lg px-8 py-4">
              Voir les logements
            </Link>
            <Link href="/auth/register?role=OWNER" className="btn-secondary text-lg px-8 py-4">
              Devenir propriétaire
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
