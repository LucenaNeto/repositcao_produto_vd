CREATE TABLE `estoques` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`produto_id` integer NOT NULL,
	`quantidade` integer DEFAULT 0 NOT NULL,
	`atualizado_em` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `movimentacoes_estoque` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`produto_id` integer NOT NULL,
	`tipo` text NOT NULL,
	`quantidade` integer NOT NULL,
	`solicitacao_id` integer,
	`criado_em` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`solicitacao_id`) REFERENCES `solicitacoes`(`id`) ON UPDATE no action ON DELETE set null
);
