import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PERSON_TYPE_LABELS } from '../../../../models/person.model';
import { PersonService } from '../../../../services/person.service';
import { maskCpfForDisplay } from '../../../../shared/utils/cpf';
import { ageOn } from '../../../../shared/utils/date';

@Component({
  selector: 'app-person-list',
  imports: [RouterLink],
  templateUrl: './person-list.component.html',
})
export class PersonListComponent {
  private readonly personService = inject(PersonService);

  readonly rows = computed(() =>
    [...this.personService.all()]
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'pt-BR'))
      .map(p => ({
        id: p.id,
        fullName: p.fullName,
        cpf: maskCpfForDisplay(p.cpf),
        age: ageOn(p.birthDate),
        types: p.types.map(t => PERSON_TYPE_LABELS[t]).join(', '),
        guardian: p.guardianId ? this.personService.getById(p.guardianId)?.fullName ?? '' : '',
        isBeneficiary: p.types.includes('beneficiario'),
      })),
  );
}
