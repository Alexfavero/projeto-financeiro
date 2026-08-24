import { AppLayout } from "@/app/layout/AppLayout";
import { Card } from "@/shared/components/Card";

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
