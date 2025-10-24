PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_movimentacoes_estoque` (
	`id` integer PRIMARY KEY NOT NULL,
	`produto_id` integer,
	`tipo` text,
	`quantidade` integer,
	`solicitacao_id` integer,
	`criado_em` text DEFAULT CURRENT_TIMESTAMP,
	`usuario` text DEFAULT 'Sistema' NOT NULL,
	FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_movimentacoes_estoque`("id", "produto_id", "tipo", "quantidade", "solicitacao_id", "criado_em", "usuario") SELECT "id", "produto_id", "tipo", "quantidade", "solicitacao_id", "criado_em", "usuario" FROM `movimentacoes_estoque`;--> statement-breakpoint
DROP TABLE `movimentacoes_estoque`;--> statement-breakpoint
ALTER TABLE `__new_movimentacoes_estoque` RENAME TO `movimentacoes_estoque`;--> statement-breakpoint
PRAGMA foreign_keys=ON;