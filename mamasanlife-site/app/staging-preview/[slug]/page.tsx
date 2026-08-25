// @ts-nocheck -- ローカル作業用のstagingプレビュー画面（本番導線なし）のため型チェック対象外
import { PortableText } from "@portabletext/react";
import { sanityStagingClient } from "@/lib/sanity.client.staging";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const stagingPostQuery = [
  '*[_type=="post" && slug.current==$slug][0]{',
  '  _id, title, "slug": slug.current,',
  '  "heroImageUrl": heroImage.asset->url,',
  '  "heroImageAlt": heroImage.alt,',
  '  publishedAt, updatedAt,',
  '  body,',
  '  affiliateBlocks,',
  '  "categoryTitle": category->title,',
  '  "tagTitles": tags[]->title',
  '}'
].join("");

function assetRefToUrl(ref) {
  if (!ref || typeof ref !== "string") return "";
  const parts = ref.split("-");
  if (parts.length < 4) return "";
  const id = parts[1];
  const dims = parts[2];
  const fmt = parts[3];
  return "https://cdn.sanity.io/images/gqv363gs/staging/" + id + "-" + dims + "." + fmt;
}

const ptComponents = {
  types: {
    linkImageRow: ({ value }) => {
      const items = (value && value.items) || [];
      if (!items.length) return null;
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", margin: "16px 0" }}>
          {items.map((it, idx) => {
            const src = it.src || "";
            const href = it.href || "";
            const alt = it.alt || "";
            if (!src) return null;
            const img = <img src={src} alt={alt} style={{ maxWidth: "100%", height: "auto", display: "block" }} />;
            if (href) {
              return (
                <a key={it._key || idx} href={href} target="_blank" rel="nofollow sponsored noopener" style={{ display: "inline-block" }}>
                  {img}
                </a>
              );
            }
            return <span key={it._key || idx}>{img}</span>;
          })}
        </div>
      );
    },
    speechBlock: ({ value }) => {
      const isRight = value && value.align === "right";
      const iconUrl = (value && value.iconUrl) || "";
      const name = (value && value.name) || "";
      const paras = (value && value.paras) || [];
      return (
        <div style={{ display: "flex", flexDirection: isRight ? "row-reverse" : "row", alignItems: "flex-start", gap: 12, margin: "16px 0" }}>
          <div style={{ flexShrink: 0, width: 64, textAlign: "center" }}>
            {iconUrl ? (
              <img src={iconUrl} alt={name} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "1px solid #ddd", background: "#fff" }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#666" }}>icon</div>
            )}
            <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{name}</div>
          </div>
          <div style={{ flex: 1, background: isRight ? "#e9f5ff" : "#f5f5f5", padding: "10px 14px", borderRadius: 12, lineHeight: 1.7, position: "relative" }}>
            <span style={{ position: "absolute", top: 16, [isRight ? "right" : "left"]: -8, width: 0, height: 0, borderTop: "8px solid transparent", borderBottom: "8px solid transparent", [isRight ? "borderLeft" : "borderRight"]: "8px solid " + (isRight ? "#e9f5ff" : "#f5f5f5") }} />
            {paras.map((p, i) => (
              <p key={i} style={{ margin: i === 0 ? "0 0 6px" : "6px 0" }}>{p}</p>
            ))}
          </div>
        </div>
      );
    },
    image: ({ value }) => {
      const ref = value && value.asset && value.asset._ref;
      const url = assetRefToUrl(ref);
      if (!url) return null;
      return <img src={url} alt={value.alt || ""} style={{ maxWidth: "100%", height: "auto", display: "block", margin: "16px auto" }} />;
    },
  },
  marks: {
    link: ({ children, value }) => {
      const href = (value && value.href) || "#";
      const isExternal = /^https?:\/\//.test(href);
      return (
        <a href={href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noopener" : undefined} style={{ color: "#0070f3", textDecoration: "underline" }}>
          {children}
        </a>
      );
    },
  },
  block: {
    normal: ({ children }) => <p style={{ margin: "8px 0", lineHeight: 1.8 }}>{children}</p>,
    h2: ({ children }) => <h2 style={{ fontSize: 22, fontWeight: 700, margin: "24px 0 12px", borderLeft: "4px solid #0070f3", paddingLeft: 8 }}>{children}</h2>,
    h3: ({ children }) => <h3 style={{ fontSize: 18, fontWeight: 700, margin: "20px 0 8px" }}>{children}</h3>,
    h4: ({ children }) => <h4 style={{ fontSize: 16, fontWeight: 700, margin: "16px 0 6px" }}>{children}</h4>,
    blockquote: ({ children }) => <blockquote style={{ borderLeft: "4px solid #ccc", paddingLeft: 12, color: "#555", margin: "12px 0" }}>{children}</blockquote>,
  },
  list: {
    bullet: ({ children }) => <ul style={{ paddingLeft: 24, margin: "8px 0" }}>{children}</ul>,
    number: ({ children }) => <ol style={{ paddingLeft: 24, margin: "8px 0" }}>{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li style={{ margin: "4px 0" }}>{children}</li>,
    number: ({ children }) => <li style={{ margin: "4px 0" }}>{children}</li>,
  },
};

const affiliateButtonCss = `
.affiliate-btn {
  display: inline-block;
  margin: 6px 6px 6px 0;
  padding: 12px 20px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  border-radius: 8px;
  border: 1px solid transparent;
  line-height: 1.4;
  text-align: center;
  transition: opacity .15s ease;
  max-width: 100%;
}
.affiliate-btn:hover { opacity: 0.85; }
.affiliate-btn--rakuten {
  background: #bf0000;
  color: #fff;
  border-color: #a00000;
}
.affiliate-btn--amazon {
  background: #ff9900;
  color: #111;
  border-color: #e08600;
}
.affiliate-btn--yahoo {
  background: #ff0033;
  color: #fff;
  border-color: #cc0029;
}
`;

export default async function StagingPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await sanityStagingClient.fetch(stagingPostQuery, { slug });
  if (!post) return notFound();
  const heroSrc = post.heroImageUrl || "";
  const affiliateBlocks = Array.isArray(post.affiliateBlocks) ? post.affiliateBlocks : [];

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: 16, fontFamily: "system-ui, sans-serif", color: "#111" }}>
      <style dangerouslySetInnerHTML={{ __html: affiliateButtonCss }} />
      <div style={{ background: "#e6f0ff", border: "1px solid #99c", padding: 8, fontSize: 12, marginBottom: 16 }}>
        Stagingプレビュー ／ dataset: staging ／ <a href={"/staging-preview/" + post.slug}>{post.slug}</a>
        {post.categoryTitle ? <span style={{ marginLeft: 12 }}>カテゴリ: {post.categoryTitle}</span> : null}
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: "16px 0" }}>{post.title}</h1>
      {heroSrc ? (
        <figure style={{ margin: "16px 0" }}>
          <img src={heroSrc} alt={post.heroImageAlt || post.title} style={{ maxWidth: "100%", maxHeight: 480, objectFit: "cover", display: "block", margin: "0 auto" }} />
          <figcaption style={{ fontSize: 12, color: "#666", textAlign: "center", marginTop: 4 }}>heroImage (Sanity Asset)</figcaption>
        </figure>
      ) : (
        <div style={{ padding: 8, background: "#fff7e6", border: "1px dashed #f0ad4e", color: "#a06000", fontSize: 12, margin: "16px 0" }}>heroImage が未設定です</div>
      )}
      {Array.isArray(post.body) ? <PortableText value={post.body} components={ptComponents} /> : null}

      {affiliateBlocks.length > 0 ? (
        <section style={{ marginTop: 32, padding: 16, background: "#fafafa", border: "1px solid #eee", borderRadius: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 12px", color: "#444" }}>
            アフィリエイトリンク（{affiliateBlocks.length}件）
          </h2>
          <p style={{ fontSize: 12, color: "#777", marginBottom: 12 }}>
            この記事に紐づく affiliateBlocks をボタン形式で表示しています。リンクをクリックすると別タブで遷移先が開きます。
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {affiliateBlocks.map((blk, i) => (
              <div key={blk._key || i} style={{ padding: 12, background: "#fff", border: "1px solid #e6e6e6", borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>
                  #{i + 1}{blk.title ? " · " + blk.title : ""}{blk.note ? " · " + blk.note : ""}
                </div>
                <div dangerouslySetInnerHTML={{ __html: blk.html || "" }} />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div style={{ marginTop: 32, padding: 12, background: "#fff7e6", border: "1px dashed #f0ad4e", color: "#a06000", fontSize: 12 }}>
          affiliateBlocks がこの記事には設定されていません
        </div>
      )}

      {Array.isArray(post.tagTitles) && post.tagTitles.length > 0 ? (
        <div style={{ marginTop: 32, paddingTop: 12, borderTop: "1px solid #eee", fontSize: 12, color: "#666" }}>
          タグ: {post.tagTitles.join(" / ")}
        </div>
      ) : null}
    </main>
  );
}
