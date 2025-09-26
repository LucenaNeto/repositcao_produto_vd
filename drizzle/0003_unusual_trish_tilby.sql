CREATE TABLE `reservas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`solicitacao_id` integer NOT NULL,
	`produto_id` integer NOT NULL,
	`quantidade` integer NOT NULL,
	`criado_em` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`solicitacao_id`) REFERENCES `solicitacoes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
ALTER TABLE `estoques` ADD `reservado` integer DEFAULT 0 NOT NULL;