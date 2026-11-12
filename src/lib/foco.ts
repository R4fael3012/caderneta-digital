/** Leva o foco ao primeiro campo com erro, depois que a tela atualizar. */
export function focarPrimeiroInvalido(form: HTMLFormElement) {
  requestAnimationFrame(() => {
    form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  })
}
