import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/app/layout/AppLayout";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { Select } from "@/shared/components/Select";
import { extractApiErrorMessage } from "@/lib/api";
import { formatBRL, hojeISO } from "@/shared/utils/format";
import { CATEGORIA_GASTO_LABELS, CategoriaGasto, StatusPagamento } from "@/types/dtos";
import type { ContaAPagarDTO, ContaAReceberDTO } from "@/types/dtos";
import { listFornecedores } from "@/features/fornecedores/api";
import { listClientes } from "@/features/clientes/api";
import { criarContaAPagar, criarContaAReceber } from "./api";
import { gerarParcelasAutomaticas } from "./gerarParcelas";
import { GerarParcelasModal } from "./GerarParcelasModal";
import {
  contaAPagarSchema,
  contaAReceberSchema,
  temNoMaximoDuasCasas,
  type ContaAPagarFormValues,
  type ContaAReceberFormValues,
  type ParcelaFormValues,
} from "./schema";

// Fluxo: o valor total é digitado primeiro. Pra 1 parcela só, edita direto
// na tabela. Pra várias, usa "gerar parcelas automaticamente" (abre modal
// com valor = total/quantidade, datas espaçadas pelo intervalo) e só deixa
// confirmar se a soma bater com o total. Depois ainda dá pra ajustar manual
// na tabela antes de salvar.
export function LancarContaPage() {
  const [tab, setTab] = useState<"pagar" | "receber">("pagar");

  return (
    <AppLayout title="Nova Conta">
      <div className="mx-auto max-w-[760px]">
        <div className="mb-5 flex w-fit rounded-lg bg-surface-alt p-1">
          <button
            type="button"
            className={`rounded-md px-4 py-2 text-sm font-semibold ${
              tab === "pagar" ? "bg-surface shadow-sm" : "text-ink-secondary"
            }`}
            onClick={() => setTab("pagar")}
          >
            Conta a Pagar
          </button>
          <button
            type="button"
            className={`rounded-md px-4 py-2 text-sm font-semibold ${
              tab === "receber" ? "bg-surface shadow-sm" : "text-ink-secondary"
            }`}
            onClick={() => setTab("receber")}
          >
            Conta a Receber
          </button>
        </div>

        {tab === "pagar" ? <ContaAPagarForm /> : <ContaAReceberForm />}
      </div>
    </AppLayout>
  );
}

function GeradorParcelasPanel({
  valorTotal,
  onGerar,
}: {
  valorTotal: number;
  onGerar: (parcelas: ParcelaFormValues[]) => void;
}) {
  const [quantidade, setQuantidade] = useState(2);
  const [intervaloDias, setIntervaloDias] = useState(30);
  const [primeiraData, setPrimeiraData] = useState(hojeISO());
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [draftGerado, setDraftGerado] = useState<ParcelaFormValues[]>([]);

  function handleGerar() {
    if (!valorTotal || valorTotal <= 0) {
      setErro("Informe o valor total da conta (acima) antes de gerar as parcelas.");
      return;
    }
    if (!quantidade || quantidade < 1) {
      setErro("Informe uma quantidade de parcelas válida.");
      return;
    }
    if (!primeiraData) {
      setErro("Informe a data da 1ª parcela.");
      return;
    }
    setErro(null);
    setDraftGerado(gerarParcelasAutomaticas(valorTotal, quantidade, intervaloDias, primeiraData));
    setModalAberto(true);
  }

  return (
    <Card title="Gerar parcelas automaticamente (opcional)">
      <p className="mb-3.5 text-xs text-ink-secondary">
        Pra uma parcela só, edite direto na tabela de Parcelas abaixo. Pra várias, informe a
        quantidade e o intervalo — o valor total é dividido automaticamente entre elas, e dá pra
        ajustar cada parcela antes de confirmar.
      </p>
      <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <Input
          label="Nº de parcelas"
          type="number"
          min={2}
          value={quantidade}
          onChange={(e) => setQuantidade(Number(e.target.value))}
        />
        <Input
          label="Intervalo (dias)"
          type="number"
          min={1}
          value={intervaloDias}
          onChange={(e) => setIntervaloDias(Number(e.target.value))}
        />
        <Input
          label="Data da 1ª parcela"
          type="date"
          value={primeiraData}
          onChange={(e) => setPrimeiraData(e.target.value)}
        />
      </div>
      <Button type="button" variant="secondary" size="sm" onClick={handleGerar}>
        Gerar parcelas
      </Button>
      {erro && <p className="mt-2 text-xs text-critical">{erro}</p>}

      <GerarParcelasModal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        valorTotal={valorTotal}
        initialParcelas={draftGerado}
        onConfirm={(parcelas) => {
          onGerar(parcelas);
          setModalAberto(false);
        }}
      />
    </Card>
  );
}

function ParcelasEditor({
  fields,
  append,
  remove,
  register,
  errors,
  total,
  valorTotal,
  valores,
}: {
  fields: { id: string }[];
  append: () => void;
  remove: (index: number) => void;
  register: any;
  errors: any;
  total: number;
  valorTotal: number;
  valores?: (Partial<ParcelaFormValues> | undefined)[];
}) {
  const diferenca = total - valorTotal;
  const naoBate = valorTotal > 0 && Math.abs(diferenca) > 0.005;
  const algumaComCasasDemais = (valores ?? []).some(
    (p) => p?.valor != null && !temNoMaximoDuasCasas(Number(p.valor) || 0),
  );

  return (
    <Card>
      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="text-sm font-bold">Parcelas</h3>
        <button type="button" className="text-xs font-semibold text-primary" onClick={append}>
          + Adicionar parcela
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-ink-secondary">
            <th className="pb-2">Nº</th>
            <th className="pb-2">Valor (R$)</th>
            <th className="pb-2">Vencimento</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field, index) => {
            const valorLinha = valores?.[index]?.valor;
            const linhaComCasasDemais = valorLinha != null && !temNoMaximoDuasCasas(Number(valorLinha) || 0);
            return (
            <tr key={field.id} className="border-b border-border last:border-0">
              <td className="py-2 pr-2">{index + 1}</td>
              <td className="py-2 pr-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  className={`w-24 rounded border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 ${
                    linhaComCasasDemais ? "border-critical" : "border-border"
                  }`}
                  {...register(`parcelas.${index}.valor` as const)}
                />
                {linhaComCasasDemais && (
                  <p className="mt-1 text-[11px] text-critical">Só 2 casas decimais</p>
                )}
              </td>
              <td className="py-2 pr-2">
                <input
                  type="date"
                  className="rounded border border-border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  {...register(`parcelas.${index}.dataVencimento` as const)}
                />
              </td>
              <td className="py-2 text-right">
                {fields.length > 1 && (
                  <button
                    type="button"
                    className="text-xs font-semibold text-critical"
                    onClick={() => remove(index)}
                  >
                    Remover
                  </button>
                )}
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {(errors?.parcelas?.message || errors?.parcelas?.root?.message) && (
        <p className="mt-2 text-xs text-critical">
          {String(errors.parcelas.message ?? errors.parcelas.root?.message)}
        </p>
      )}

      <div
        className={`mt-2.5 flex justify-between text-[13px] ${
          naoBate ? "font-semibold text-critical" : "text-ink-secondary"
        }`}
      >
        <span>
          Total das parcelas: <b className={naoBate ? "text-critical" : "text-ink"}>{formatBRL(total)}</b>
        </span>
        {valorTotal > 0 && (
          <span>
            Valor total informado: <b className="text-ink">{formatBRL(valorTotal)}</b>
          </span>
        )}
      </div>
      {naoBate && (
        <p className="mt-1 text-right text-xs text-critical">
          {diferenca > 0
            ? `A soma está ${formatBRL(diferenca)} acima do valor total.`
            : `A soma está ${formatBRL(Math.abs(diferenca))} abaixo do valor total.`}{" "}
          Se o valor total está errado, corrija-o acima em vez de forçar as parcelas.
        </p>
      )}
      {algumaComCasasDemais && (
        <p className="mt-1 text-right text-xs text-critical">
          Alguma parcela tem mais de 2 casas decimais — corrija antes de salvar.
        </p>
      )}
    </Card>
  );
}

function ContaAPagarForm() {
  const navigate = useNavigate();
  const fornecedoresQuery = useQuery({ queryKey: ["fornecedores"], queryFn: listFornecedores });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ContaAPagarFormValues>({
    resolver: zodResolver(contaAPagarSchema),
    defaultValues: {
      valorTotal: 0,
      fornecedorId: "",
      categoria: CategoriaGasto.Mercadoria,
      numeroNota: "",
      descricao: "",
      parcelas: [{ valor: 0, dataVencimento: "" }],
    },
  });
  const { fields, append, remove, replace } = useFieldArray({ control, name: "parcelas" });
  const parcelasWatch = useWatch({ control, name: "parcelas" });
  const valorTotalWatch = Number(useWatch({ control, name: "valorTotal" })) || 0;
  const totalParcelas = (parcelasWatch ?? []).reduce((soma, p) => soma + (Number(p?.valor) || 0), 0);

  const mutation = useMutation({
    mutationFn: criarContaAPagar,
    onSuccess: () => {
      navigate("/", { state: { successMessage: "Conta a pagar lançada com sucesso!" } });
    },
  });

  function onSubmit(values: ContaAPagarFormValues) {
    const payload: ContaAPagarDTO = {
      documentoFinanceiroId: 0,
      valorTotal: values.valorTotal,
      fornecedorId: values.fornecedorId ? Number(values.fornecedorId) : null,
      numeroNota: values.numeroNota || null,
      descricao: values.descricao || null,
      categoria: values.categoria,
      parcelas: values.parcelas.map((p) => ({
        parcelaId: 0,
        valor: p.valor,
        dataVencimento: p.dataVencimento,
        dataPagamento: null,
        status: StatusPagamento.Pendente,
        documentoFinanceiroId: 0,
      })),
    };
    mutation.mutate(payload);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {mutation.isError && (
        <div className="mb-4 rounded-lg bg-critical/10 px-4 py-3 text-sm font-semibold text-critical">
          {extractApiErrorMessage(mutation.error, "Não foi possível lançar a conta.")}
        </div>
      )}

      <Card title="Dados da Conta">
        <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Input
            label="Valor Total (R$)"
            type="number"
            step="0.01"
            placeholder="0,00"
            error={errors.valorTotal?.message}
            {...register("valorTotal", { valueAsNumber: true })}
          />
          <Select label="Fornecedor" {...register("fornecedorId")}>
            <option value="">Sem fornecedor</option>
            {fornecedoresQuery.data?.map((f) => (
              <option key={f.fornecedorId} value={f.fornecedorId}>
                {f.nome}
              </option>
            ))}
          </Select>
          <Select label="Categoria" error={errors.categoria?.message} {...register("categoria")}>
            {Object.entries(CATEGORIA_GASTO_LABELS).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </Select>
          <Input label="Número da Nota" placeholder="Ex.: 12345" {...register("numeroNota")} />
        </div>
        <Input label="Descrição" placeholder="Descrição da conta (opcional)" {...register("descricao")} />
      </Card>

      <div className="mt-4">
        <GeradorParcelasPanel valorTotal={valorTotalWatch} onGerar={replace} />
      </div>

      <div className="mt-4">
        <ParcelasEditor
          fields={fields}
          append={() => append({ valor: 0, dataVencimento: "" })}
          remove={remove}
          register={register}
          errors={errors}
          total={totalParcelas}
          valorTotal={valorTotalWatch}
          valores={parcelasWatch}
        />
      </div>

      <div className="mt-5 flex justify-end gap-2.5">
        <Button type="button" variant="secondary" onClick={() => navigate("/")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando…" : "Salvar Lançamento"}
        </Button>
      </div>
    </form>
  );
}

function ContaAReceberForm() {
  const navigate = useNavigate();
  const clientesQuery = useQuery({ queryKey: ["clientes"], queryFn: listClientes });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ContaAReceberFormValues>({
    resolver: zodResolver(contaAReceberSchema),
    defaultValues: {
      valorTotal: 0,
      clienteId: "",
      dataVenda: hojeISO(),
      parcelas: [{ valor: 0, dataVencimento: "" }],
    },
  });
  const { fields, append, remove, replace } = useFieldArray({ control, name: "parcelas" });
  const parcelasWatch = useWatch({ control, name: "parcelas" });
  const valorTotalWatch = Number(useWatch({ control, name: "valorTotal" })) || 0;
  const totalParcelas = (parcelasWatch ?? []).reduce((soma, p) => soma + (Number(p?.valor) || 0), 0);

  const mutation = useMutation({
    mutationFn: criarContaAReceber,
    onSuccess: () => {
      navigate("/", { state: { successMessage: "Conta a receber lançada com sucesso!" } });
    },
  });

  function onSubmit(values: ContaAReceberFormValues) {
    const payload: ContaAReceberDTO = {
      documentoFinanceiroId: 0,
      valorTotal: values.valorTotal,
      clienteId: Number(values.clienteId),
      dataVenda: values.dataVenda,
      parcelas: values.parcelas.map((p) => ({
        parcelaId: 0,
        valor: p.valor,
        dataVencimento: p.dataVencimento,
        dataPagamento: null,
        status: StatusPagamento.Pendente,
        documentoFinanceiroId: 0,
      })),
    };
    mutation.mutate(payload);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {mutation.isError && (
        <div className="mb-4 rounded-lg bg-critical/10 px-4 py-3 text-sm font-semibold text-critical">
          {extractApiErrorMessage(mutation.error, "Não foi possível lançar a conta.")}
        </div>
      )}

      <Card title="Dados da Conta">
        <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Input
            label="Valor Total (R$)"
            type="number"
            step="0.01"
            placeholder="0,00"
            error={errors.valorTotal?.message}
            {...register("valorTotal", { valueAsNumber: true })}
          />
          <Select label="Cliente" error={errors.clienteId?.message} {...register("clienteId")}>
            <option value="">Selecione um cliente</option>
            {clientesQuery.data?.map((c) => (
              <option key={c.clienteId} value={c.clienteId}>
                {c.nome}
              </option>
            ))}
          </Select>
          <Input
            label="Data da Venda"
            type="date"
            error={errors.dataVenda?.message}
            {...register("dataVenda")}
          />
        </div>
      </Card>

      <div className="mt-4">
        <GeradorParcelasPanel valorTotal={valorTotalWatch} onGerar={replace} />
      </div>

      <div className="mt-4">
        <ParcelasEditor
          fields={fields}
          append={() => append({ valor: 0, dataVencimento: "" })}
          remove={remove}
          register={register}
          errors={errors}
          total={totalParcelas}
          valorTotal={valorTotalWatch}
          valores={parcelasWatch}
        />
      </div>

      <div className="mt-5 flex justify-end gap-2.5">
        <Button type="button" variant="secondary" onClick={() => navigate("/")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando…" : "Salvar Lançamento"}
        </Button>
      </div>
    </form>
  );
}
