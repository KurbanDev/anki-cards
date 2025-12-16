import {createClient} from "@supabase/supabase-js";
import {Card} from "@/composables/Card";
import {CardStateDto} from "@/domain/cards/persistence/localStorageGateway";

const supabaseUrl = "https://glgjvggbedqijbqogtfx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsZ2p2Z2diZWRxaWpicW9ndGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNDc3OTksImV4cCI6MjA4MDcyMzc5OX0.4m8TQorl64ila2m3wfndAC94YBH_vq7EtYdrxLNJWog";
const supabase = createClient(supabaseUrl, supabaseKey);

function serializeCards(cards: Card[]): CardStateDto[] {
  return cards.map((c) => ({
    q: c.getQuestion(),
    a: c.getAnswer(),
    level: c.getLevel(),
    nextShowDate: c.getNextShowDate(),
  }));
}

function deserializeCards(data: CardStateDto[]): Card[] {
  return data.map(
      (c) =>
          new Card({
            q: c.q,
            a: c.a,
            level: c.level,
            nextShowDate: c.nextShowDate,
          })
  );
}

export async function fetchRemoteVersion() {
  const {data: rows} = await supabase
      .from("state")
      .select("version")
      .order("id", {ascending: true})
      .limit(1);

  return rows?.[0]?.version as number | undefined;
}

export async function saveStateToSupabase(cards: Card[], version: number) {
  const data = serializeCards(cards);
  const {data: rows, error: selectError} = await supabase
      .from("state")
      .select("id, version")
      .order("id", {ascending: true})
      .limit(1);

  if (selectError) {
    throw new Error("Ошибка чтения из Supabase");
  }

  const existingRow = rows?.[0];

  if (existingRow) {
    const {data: updated, error: updateError} = await supabase
        .from("state")
        .update({data})
        .eq("id", existingRow.id)
        .select("version")
        .single();

    if (updateError) {
      throw new Error("Ошибка обновления в Supabase");
    }

    return updated?.version ?? version;
  }

  const {data: inserted, error: insertError} = await supabase
      .from("state")
      .insert({data, version: 1})
      .select("version")
      .single();

  if (insertError) {
    throw new Error("Ошибка создания записи в Supabase");
  }

  return inserted?.version ?? version;
}

export async function loadStateFromSupabase() {
  const {data, error} = await supabase
      .from("state")
      .select("data, version")
      .single();

  if (error) {
    throw new Error("Ошибка загрузки из Supabase");
  }

  if (!data?.data) {
    throw new Error("Для этого пользователя нет сохранённого состояния");
  }

  return {cards: deserializeCards(data.data as CardStateDto[]), version: data.version as number};
}
