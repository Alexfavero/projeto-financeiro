import { AppLayout } from "@/app/layout/AppLayout";
import { Card } from "@/shared/components/Card";

/**
 * Placeholder pras rotas que ainda não foram implementadas, só pra dar
 * pra navegar pela Sidebar inteira sem quebrar nada. Cada uma dessas vira
 * uma feature de verdade nas próximas partes.
 */
export function ComingSoonPage({ title }: { title: string }) {
  return (
    <AppLayout title={title}>
      <Card>
        <p className="text-sm text-ink-secondary">
          Esta tela ainda não foi implementada — chega em uma das próximas
          partes.
        </p>
      </Card>
    </AppLayout>
  );
}
